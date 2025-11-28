import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import OTP from '@/models/OTP';
import User from '@/models/User';

export async function POST(req: Request) {
    await dbConnect();
    const { action, phone, otp } = await req.json();

    if (action === 'send') {
        // 1. Check if user already exists (for registration flow, we might want to allow checking this separately, 
        // but for now let's just focus on OTP logic. The registration API will check user existence before final create).
        // Actually, for "Forgot Password", user MUST exist. For "Register", user MUST NOT exist.
        // Let's keep OTP generic for now, or handle context if passed.

        // 2. Rate Limiting: Check if OTP exists and is recent
        const existingOTP = await OTP.findOne({ phone });
        if (existingOTP) {
            if (existingOTP.blockedUntil && existingOTP.blockedUntil > new Date()) {
                return NextResponse.json({ message: `Too many attempts. Try again after ${existingOTP.blockedUntil.toLocaleTimeString()}` }, { status: 429 });
            }

            const timeDiff = (new Date().getTime() - new Date(existingOTP.updatedAt).getTime()) / 1000;
            if (timeDiff < 60) { // 1 minute rate limit
                return NextResponse.json({ message: 'Please wait 1 minute before requesting another OTP' }, { status: 429 });
            }
        }

        // 3. Generate OTP
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

        // 4. Save/Update OTP
        if (existingOTP) {
            existingOTP.otp = generatedOtp;
            existingOTP.attempts = 0;
            existingOTP.updatedAt = new Date();
            await existingOTP.save();
        } else {
            await OTP.create({ phone, otp: generatedOtp });
        }

        // 5. Send OTP (Mock)
        console.log(`[MOCK SMS] OTP for ${phone}: ${generatedOtp}`);

        return NextResponse.json({ message: 'OTP sent successfully', otp: generatedOtp });
    }

    else if (action === 'verify') {
        const record = await OTP.findOne({ phone });

        if (!record) {
            return NextResponse.json({ message: 'OTP not found or expired' }, { status: 400 });
        }

        if (record.blockedUntil && record.blockedUntil > new Date()) {
            return NextResponse.json({ message: 'Account blocked temporarily due to too many failed attempts' }, { status: 429 });
        }

        if (record.otp !== otp) {
            record.attempts += 1;
            if (record.attempts >= 5) {
                record.blockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Block for 15 mins
                await record.save();
                return NextResponse.json({ message: 'Too many failed attempts. Blocked for 15 minutes.' }, { status: 429 });
            }
            await record.save();
            return NextResponse.json({ message: 'Invalid OTP' }, { status: 400 });
        }

        // OTP Verified
        // We don't delete it yet, we might want to verify it again during final registration commit?
        // Or we can issue a temporary token?
        // For simplicity, let's just return success. The client will send the OTP again to the register endpoint to prove verification?
        // Better: Register endpoint verifies it again or we trust the client flow (less secure).
        // Secure approach: Register endpoint should verify OTP and delete it.
        // So this 'verify' action might be just for UI feedback, or we can skip it and do it in Register.
        // But the prompt asked for "verify it and then only confirm".
        // So we can return success here.

        return NextResponse.json({ message: 'OTP verified successfully' });
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
}

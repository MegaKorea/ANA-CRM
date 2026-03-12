import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { getStudentAccountByPhone } from '@/lib/services/student_account.service';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phone_number, password } = body;

        if (!phone_number || !password) {
            return NextResponse.json(
                { error: 'Phone number and password are required' },
                { status: 400 }
            );
        }

        // 1. Fetch student account
        const account = await getStudentAccountByPhone(phone_number);

        if (!account) {
            return NextResponse.json(
                { error: 'Invalid phone number or password' },
                { status: 401 }
            );
        }

        if (account.status !== 'active') {
            return NextResponse.json(
                { error: 'Account is locked' },
                { status: 403 }
            );
        }

        // 2. Verify password
        const expectedHash = account.password_hash;

        let isValid = false;
        try {
            isValid = await bcrypt.compare(password, expectedHash);
        } catch (e) {
            console.error('Bcrypt comparison failed', e);
        }

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid phone number or password' },
                { status: 401 }
            );
        }

        // 3. Generate JWT
        const secret = new TextEncoder().encode(JWT_SECRET);
        const token = await new SignJWT({
            sub: account.id,
            lead_id: account.lead_id,
            phone_number: account.phone_number,
            role: 'student'
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('7d') // Valid for 7 days
            .sign(secret);

        // 4. Set Cookie
        const response = NextResponse.json(
            { success: true, message: 'Logged in successfully' },
            { status: 200 }
        );

        response.cookies.set('ana_student_session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        });

        return response;

    } catch (error: any) {
        console.error('Student login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

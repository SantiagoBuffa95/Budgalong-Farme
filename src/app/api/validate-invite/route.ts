import { NextRequest, NextResponse } from 'next/server';
import { validateInviteToken } from '@/lib/invite-actions';

export async function GET(request: NextRequest) {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
        return NextResponse.json({ valid: false, error: 'No token provided' });
    }

    const result = await validateInviteToken(token);
    return NextResponse.json(result);
}

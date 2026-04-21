
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        NEXT_PUBLIC_APPWRITE_PROJECT: process.env.NEXT_PUBLIC_APPWRITE_PROJECT,
        NEXT_APPWRITE_KEY: process.env.NEXT_APPWRITE_KEY,
        NEXT_PUBLIC_DATABASE: process.env.NEXT_PUBLIC_DATABASE,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    });
}

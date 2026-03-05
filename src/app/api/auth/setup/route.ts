import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

// Cette route crée le Super Admin initial
export async function POST(request: NextRequest) {
  try {
    // Vérifier s'il existe déjà un Super Admin
    const existingSuperAdmin = await db.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    if (existingSuperAdmin) {
      return NextResponse.json(
        { error: 'Un Super Admin existe déjà' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    // Créer le Super Admin
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashPassword(password),
        name,
        role: 'SUPER_ADMIN'
      }
    });

    return NextResponse.json({
      message: 'Super Admin créé avec succès',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur création Super Admin:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// Vérifier si un Super Admin existe
export async function GET() {
  try {
    const superAdmin = await db.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
      select: { id: true }
    });

    return NextResponse.json({
      hasSuperAdmin: !!superAdmin
    });
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

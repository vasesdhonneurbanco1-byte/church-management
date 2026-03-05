import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Helper pour hasher le mot de passe (simple pour demo)
export function hashPassword(password: string): string {
  // Utilisation d'un hash simple pour la démo
  // En production, utilisez bcrypt ou argon2
  return Buffer.from(password + 'church_salt_2024').toString('base64');
}

// Helper pour vérifier le mot de passe
export function verifyPassword(password: string, hashedPassword: string): boolean {
  return hashPassword(password) === hashedPassword;
}

// Vérifier si un utilisateur est authentifié
export async function getAuthUser(): Promise<{
  id: string;
  email: string;
  name: string;
  role: string;
} | null> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    if (!userId) {
      return null;
    }
    
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true }
    });
    
    return user;
  } catch {
    return null;
  }
}

// Middleware pour protéger les routes API
export async function requireAuth(request: NextRequest) {
  const user = await getAuthUser();
  
  if (!user) {
    return NextResponse.json(
      { error: 'Non autorisé' },
      { status: 401 }
    );
  }
  
  return user;
}

// Middleware pour les routes Super Admin
export async function requireSuperAdmin() {
  const user = await getAuthUser();
  
  if (!user || user.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { error: 'Accès refusé. Super Admin requis.' },
      { status: 403 }
    );
  }
  
  return user;
}

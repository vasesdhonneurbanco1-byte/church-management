import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Récupérer la configuration de l'église
export async function GET() {
  try {
    // Essayer de récupérer la config existante
    const config = await db.churchConfig.findFirst();

    if (config) {
      return NextResponse.json({
        name: config.name,
        logo: config.logo
      });
    }

    // Créer une config par défaut si elle n'existe pas
    const newConfig = await db.churchConfig.create({
      data: {
        name: 'Mon Église',
        logo: null
      }
    });

    return NextResponse.json({
      name: newConfig.name,
      logo: newConfig.logo
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la config:', error);
    return NextResponse.json({ name: 'Mon Église', logo: null });
  }
}

// POST - Sauvegarder la configuration de l'église
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, logo } = body;

    // Vérifier si une config existe déjà
    const existingConfig = await db.churchConfig.findFirst();

    let config;
    if (existingConfig) {
      // Mettre à jour
      config = await db.churchConfig.update({
        where: { id: existingConfig.id },
        data: {
          name: name || 'Mon Église',
          logo: logo || null
        }
      });
    } else {
      // Créer
      config = await db.churchConfig.create({
        data: {
          name: name || 'Mon Église',
          logo: logo || null
        }
      });
    }

    return NextResponse.json({
      message: 'Configuration enregistrée',
      name: config.name,
      logo: config.logo
    });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde' },
      { status: 500 }
    );
  }
}

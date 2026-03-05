import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// Fonction pour normaliser et grouper les données
function normalizeAndGroup(data: Array<{ [key: string]: string | null; _count: number }>, field: string) {
  const grouped: Record<string, number> = {};
  
  for (const item of data) {
    const value = item[field];
    if (value) {
      // Normaliser : trim, majuscules, supprimer les espaces multiples
      const normalized = value.trim().replace(/\s+/g, ' ');
      grouped[normalized] = (grouped[normalized] || 0) + item._count;
    }
  }
  
  // Convertir en tableau et trier par count décroissant
  return Object.entries(grouped)
    .map(([key, count]) => ({ [field]: key, _count: count }))
    .sort((a, b) => b._count - a._count);
}

// GET - Statistiques
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Total des personnes
    const total = await db.person.count();

    // Par tranche d'âge
    const parTrancheAge = await db.person.groupBy({
      by: ['trancheAge'],
      _count: true
    });

    // Par quartier (avec normalisation)
    const parQuartierRaw = await db.person.groupBy({
      by: ['quartier'],
      _count: true
    });

    // Par profession (avec normalisation)
    const parProfessionRaw = await db.person.groupBy({
      by: ['profession'],
      _count: true
    });

    // Par personne ressource (avec normalisation)
    const parPersonneRessourceRaw = await db.person.groupBy({
      by: ['personneRessource'],
      _count: true
    });

    // Par situation matrimoniale
    const parSituationMatrimoniale = await db.person.groupBy({
      by: ['situationMatrimoniale'],
      _count: true
    });

    // Statistiques des options spirituelles
    const accepteJesus = await db.person.count({ where: { accepteJesus: true } });
    const veutBapteme = await db.person.count({ where: { veutBapteme: true } });
    const besoinSuivi = await db.person.count({ where: { besoinSuivi: true } });
    const voirPasteur = await db.person.count({ where: { voirPasteur: true } });
    const besoinPriere = await db.person.count({ where: { besoinPriere: true } });
    const integrerEglise = await db.person.count({ where: { integrerEglise: true } });

    // Anniversaires du mois
    const now = new Date();
    const moisActuel = now.getMonth() + 1;
    const anniversairesDuMois = await db.person.findMany({
      where: { moisAnniversaire: moisActuel },
      orderBy: [{ jourAnniversaire: 'asc' }]
    });

    // Anniversaires aujourd'hui
    const jourActuel = now.getDate();
    const anniversairesAujourd = await db.person.findMany({
      where: {
        moisAnniversaire: moisActuel,
        jourAnniversaire: jourActuel
      }
    });

    return NextResponse.json({
      total,
      parTrancheAge: parTrancheAge.filter(p => p.trancheAge),
      parQuartier: normalizeAndGroup(parQuartierRaw, 'quartier'),
      parProfession: normalizeAndGroup(parProfessionRaw, 'profession'),
      parPersonneRessource: normalizeAndGroup(parPersonneRessourceRaw, 'personneRessource'),
      parSituationMatrimoniale: parSituationMatrimoniale.filter(p => p.situationMatrimoniale),
      spirituels: {
        accepteJesus,
        veutBapteme,
        besoinSuivi,
        voirPasteur,
        besoinPriere,
        integrerEglise
      },
      anniversairesDuMois,
      anniversairesAujourd
    });
  } catch (error) {
    console.error('Erreur statistiques:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// Fonction pour normaliser une chaîne (supprimer accents, espaces, etc.)
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/\s+/g, ' ')
    .trim();
}

// Fonction pour normaliser un numéro de téléphone (supprimer espaces, tirets, etc.)
function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\.\(\)]/g, '');
}

// Extraire tous les numéros de téléphone d'une chaîne (séparés par /, ,, ; ou saut de ligne)
function extractPhones(phoneStr: string): string[] {
  if (!phoneStr) return [];
  return phoneStr
    .split(/[/,;\n]+/)
    .map(p => normalizePhone(p.trim()))
    .filter(p => p.length > 0);
}

// Vérifier si deux personnes sont des doublons potentiels
function isDuplicate(name1: string, phones1: string[], name2: string, phones2: string[]): { isDup: boolean; reason: string } {
  const normName1 = normalize(name1);
  const normName2 = normalize(name2);
  
  // Vérifier si les noms sont identiques
  const sameName = normName1 === normName2;
  
  // Vérifier si au moins un numéro de téléphone correspond
  const hasCommonPhone = phones1.some(p1 => phones2.some(p2 => p1 === p2 && p1.length >= 8));
  
  // Doublon si même nom ET au moins un téléphone en commun
  if (sameName && hasCommonPhone) {
    return { isDup: true, reason: 'Même nom et même numéro de téléphone' };
  }
  
  // Doublon si même nom ET pas de téléphone renseigné pour les deux
  if (sameName && phones1.length === 0 && phones2.length === 0) {
    return { isDup: true, reason: 'Même nom et aucun téléphone renseigné' };
  }
  
  // Doublon si même téléphone ET noms très similaires (même nom normalisé)
  if (hasCommonPhone && sameName) {
    return { isDup: true, reason: 'Même téléphone et même nom' };
  }
  
  return { isDup: false, reason: '' };
}

// GET - Liste toutes les personnes avec filtres
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const nom = searchParams.get('nom');
    const telephone = searchParams.get('telephone');
    const trancheAge = searchParams.get('trancheAge');
    const moisArrivee = searchParams.get('moisArrivee');
    const anneeArrivee = searchParams.get('anneeArrivee');
    const moisAnniversaire = searchParams.get('moisAnniversaire');
    const quartier = searchParams.get('quartier');

    // Récupérer toutes les personnes d'abord
    let persons = await db.person.findMany({
      orderBy: [{ numero: 'asc' }, { createdAt: 'desc' }],
      include: {
        user: {
          select: { name: true }
        }
      }
    });

    // Appliquer les filtres côté JavaScript (pour SQLite)
    if (nom) {
      const nomNorm = normalize(nom);
      persons = persons.filter(p => 
        normalize(p.nomPrenoms).includes(nomNorm)
      );
    }

    if (telephone) {
      const telNorm = normalizePhone(telephone);
      persons = persons.filter(p => {
        const phones = extractPhones(p.telephone || '');
        return phones.some(ph => ph.includes(telNorm));
      });
    }

    if (trancheAge && trancheAge !== 'all') {
      persons = persons.filter(p => p.trancheAge === trancheAge);
    }

    if (moisAnniversaire && moisAnniversaire !== 'all') {
      const mois = parseInt(moisAnniversaire);
      persons = persons.filter(p => p.moisAnniversaire === mois);
    }

    if (quartier) {
      const quartierNorm = normalize(quartier);
      persons = persons.filter(p => 
        p.quartier && normalize(p.quartier).includes(quartierNorm)
      );
    }

    // Filtre par mois d'arrivée (format dateArrivee: DD/MM/YYYY)
    if (moisArrivee && moisArrivee !== 'all') {
      const mois = parseInt(moisArrivee);
      persons = persons.filter(p => {
        if (!p.dateArrivee) return false;
        const parts = p.dateArrivee.split('/');
        if (parts.length === 3) {
          return parseInt(parts[1]) === mois;
        }
        return false;
      });
    }

    // Filtre par année d'arrivée
    if (anneeArrivee && anneeArrivee !== 'all') {
      persons = persons.filter(p => {
        if (!p.dateArrivee) return false;
        const parts = p.dateArrivee.split('/');
        if (parts.length === 3) {
          return parts[2] === anneeArrivee;
        }
        return false;
      });
    }

    return NextResponse.json({ persons });
  } catch (error) {
    console.error('Erreur liste personnes:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Créer une nouvelle personne
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();

    // Extraire les téléphones de la nouvelle personne
    const newPhones = extractPhones(body.telephone || '');
    const newName = body.nomPrenoms;

    // Vérifier si une personne similaire existe déjà
    const existingPersons = await db.person.findMany();
    
    for (const existing of existingPersons) {
      const existingPhones = extractPhones(existing.telephone || '');
      const dupCheck = isDuplicate(newName, newPhones, existing.nomPrenoms, existingPhones);
      
      if (dupCheck.isDup) {
        return NextResponse.json({ 
          error: `⚠️ Doublon détecté : "${existing.nomPrenoms}" (N° ${existing.numero}) existe déjà avec les mêmes informations.`,
          reason: dupCheck.reason,
          existingPerson: {
            id: existing.id,
            numero: existing.numero,
            nomPrenoms: existing.nomPrenoms,
            telephone: existing.telephone,
            quartier: existing.quartier
          }
        }, { status: 409 });
      }
    }

    // Obtenir le dernier numéro
    const lastPerson = await db.person.findFirst({
      orderBy: { numero: 'desc' },
      select: { numero: true }
    });

    const nextNumero = (lastPerson?.numero || 0) + 1;

    const person = await db.person.create({
      data: {
        numero: nextNumero,
        nomPrenoms: body.nomPrenoms,
        telephone: body.telephone || null,
        quartier: body.quartier || null,
        profession: body.profession || null,
        communauteFrequentee: body.communauteFrequentee || null,
        trancheAge: body.trancheAge || null,
        situationMatrimoniale: body.situationMatrimoniale || null,
        dateArrivee: body.dateArrivee || null,
        jourAnniversaire: body.jourAnniversaire ? parseInt(body.jourAnniversaire) : null,
        moisAnniversaire: body.moisAnniversaire ? parseInt(body.moisAnniversaire) : null,
        accepteJesus: body.accepteJesus || false,
        veutBapteme: body.veutBapteme || false,
        besoinSuivi: body.besoinSuivi || false,
        voirPasteur: body.voirPasteur || false,
        besoinPriere: body.besoinPriere || false,
        integrerEglise: body.integrerEglise || false,
        indecis: body.indecis || false,
        renseignementsEglise: body.renseignementsEglise || false,
        email: body.email || null,
        matricule: body.matricule || null,
        personneRessource: body.personneRessource || null,
        contacts: body.contacts || null,
        photo: body.photo || null,
        note: body.note || null,
        createdBy: user.id
      }
    });

    return NextResponse.json({ person, message: 'Personne enregistrée avec succès' });
  } catch (error) {
    console.error('Erreur création personne:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

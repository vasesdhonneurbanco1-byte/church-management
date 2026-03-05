import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET - Obtenir une personne par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    const person = await db.person.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    if (!person) {
      return NextResponse.json({ error: 'Personne non trouvée' }, { status: 404 });
    }

    return NextResponse.json({ person });
  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT - Mettre à jour une personne
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const person = await db.person.update({
      where: { id },
      data: {
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
        note: body.note || null
      }
    });

    return NextResponse.json({ person, message: 'Personne mise à jour avec succès' });
  } catch (error) {
    console.error('Erreur mise à jour:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer une personne
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    await db.person.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Personne supprimée avec succès' });
  } catch (error) {
    console.error('Erreur suppression:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

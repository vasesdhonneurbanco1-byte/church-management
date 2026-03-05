import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// GET - Export Excel (format CSV compatible)
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const persons = await db.person.findMany({
      orderBy: [{ numero: 'asc' }],
      include: {
        user: {
          select: { name: true }
        }
      }
    });

    // En-têtes CSV
    const headers = [
      'N°',
      'Nom & Prénoms',
      'Téléphone',
      'Quartier',
      'Profession',
      'Communauté fréquentée',
      'Tranche d\'âge',
      'Situation matrimoniale',
      'Date d\'arrivée',
      'Date d\'anniversaire',
      'J\'accepte Jésus',
      'Je veux être baptisé',
      'Besoin de suivi',
      'Voir un pasteur',
      'Besoin de prière',
      'Intégrer Église',
      'Je suis indécis',
      'Renseignements sur l\'Église',
      'E-mail',
      'Matricule',
      'Personne ressource',
      'Contacts',
      'Note',
      'Enregistré par',
      'Date de création'
    ];

    // Fonction pour échapper les valeurs CSV
    const escapeCSV = (value: unknown): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Nom du mois
    const moisNoms = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    // Lignes de données
    const rows = persons.map(p => [
      p.numero,
      escapeCSV(p.nomPrenoms),
      escapeCSV(p.telephone),
      escapeCSV(p.quartier),
      escapeCSV(p.profession),
      escapeCSV(p.communauteFrequentee),
      escapeCSV(p.trancheAge),
      escapeCSV(p.situationMatrimoniale),
      escapeCSV(p.dateArrivee),
      p.jourAnniversaire && p.moisAnniversaire 
        ? `${p.jourAnniversaire} ${moisNoms[p.moisAnniversaire]}` 
        : '',
      p.accepteJesus ? 'Oui' : 'Non',
      p.veutBapteme ? 'Oui' : 'Non',
      p.besoinSuivi ? 'Oui' : 'Non',
      p.voirPasteur ? 'Oui' : 'Non',
      p.besoinPriere ? 'Oui' : 'Non',
      p.integrerEglise ? 'Oui' : 'Non',
      p.indecis ? 'Oui' : 'Non',
      p.renseignementsEglise ? 'Oui' : 'Non',
      escapeCSV(p.email),
      escapeCSV(p.matricule),
      escapeCSV(p.personneRessource),
      escapeCSV(p.contacts),
      escapeCSV(p.note),
      escapeCSV(p.user?.name || ''),
      new Date(p.createdAt).toLocaleDateString('fr-FR')
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');

    // Ajouter BOM pour UTF-8 (Excel)
    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;

    return new NextResponse(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="personnes_eglise_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    console.error('Erreur export:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

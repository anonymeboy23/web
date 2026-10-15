export const curriculumOptions: Record<string, string[]> = {
  "": [],
  "Littéraire": ["Latin-Philosophie", "Latin-Grec"],
  "Scientifique": ["Mathématique-Physique", "Chimie-Biologie"],
  "Pédagogique": ["Pédagogie générale", "Normale", "Éducation physique"],
  "Technique": ["Commerciale et gestion", "Construction", "Électricité", "Mécanique", "Chimie industrielle", "Agriculture et agronomie", "Mines et géologie"],
};

// Référentiel de base inspiré des domaines et documents publiés par le MINEDU-NC.
// Les coefficients restent modifiables par l'administration car ils peuvent varier
// selon l'option et le document de cotation appliqué par l'établissement.
const maternelle = ["Langage et communication", "Prélecture et préécriture", "Éveil mathématique", "Éveil scientifique", "Éveil social", "Éducation artistique", "Psychomotricité", "Éducation morale"];
const primaireElementaire = ["Langues congolaises - expression orale", "Langues congolaises - expression écrite", "Français - vocabulaire", "Français - expression orale", "Lecture-écriture", "Mathématiques - numération et opérations", "Mathématiques - mesures et formes", "Sciences d'éveil", "Technologie", "Éducation civique et morale", "Éducation à la santé et à l'environnement", "Arts plastiques", "Arts dramatiques", "Éducation physique et sportive", "Religion", "Activités de la vie"];
const primaireMoyen = ["Langues congolaises - lecture et écriture", "Langues congolaises - grammaire et conjugaison", "Français - expression orale", "Français - vocabulaire et récitation", "Français - orthographe", "Français - grammaire et conjugaison", "Français - lecture et rédaction", "Mathématiques", "Sciences", "Technologie", "Histoire", "Géographie", "Éducation civique et morale", "Éducation à la vie, santé et environnement", "Arts plastiques", "Arts dramatiques", "Éducation physique et sportive", "Religion", "Travaux productifs"];
const primaireTerminal = ["Langues congolaises - grammaire et conjugaison", "Langues congolaises - expression orale et vocabulaire", "Langues congolaises - orthographe et rédaction", "Langues congolaises - lecture-écriture", "Français - expression orale", "Français - vocabulaire", "Français - orthographe", "Français - rédaction", "Français - grammaire et conjugaison", "Français - analyse et lecture", "Mathématiques", "Sciences", "Technologie", "Éducation civique et morale", "Éducation à la santé et à l'environnement", "Histoire", "Géographie", "Arts plastiques", "Arts dramatiques", "Éducation physique et sportive", "Religion", "Activités de la vie"];
const educationBase = ["Français", "Anglais", "Mathématiques - arithmétique, algèbre, géométrie et statistique", "Sciences de la vie et de la Terre", "Sciences physiques", "Technologie et TIC", "Éducation à la vie", "Éducation civique et morale", "Histoire", "Géographie", "Religion", "Dessin", "Musique", "Éducation physique et sportive"];
const humanitesCommun = ["Français", "Mathématiques", "Anglais", "Histoire", "Géographie", "Éducation civique et morale", "Éducation à la vie", "Informatique", "Religion", "Éducation physique et sportive"];

const optionSubjects: Record<string, string[]> = {
  "Mathématique-Physique": ["Mathématiques approfondies", "Physique", "Chimie", "Dessin scientifique", "Laboratoire"],
  "Chimie-Biologie": ["Mathématiques approfondies", "Chimie", "Biologie", "Sciences de la vie et de la terre", "Laboratoire"],
  "Latin-Philosophie": ["Latin", "Philosophie", "Littérature"],
  "Latin-Grec": ["Latin", "Grec", "Philosophie", "Littérature"],
  "Pédagogie générale": ["Psychopédagogie", "Didactique générale", "Pratique professionnelle", "Technologie de l'éducation"],
  Normale: ["Psychopédagogie", "Didactique générale", "Pratique professionnelle", "Technologie de l'éducation"],
  "Éducation physique": ["Psychopédagogie", "Didactique de l'éducation physique", "Anatomie", "Physiologie", "Pratique sportive"],
  "Commerciale et gestion": ["Comptabilité", "Économie", "Gestion", "Droit", "Secrétariat", "Correspondance commerciale", "Statistique"],
  Construction: ["Dessin technique", "Technologie de construction", "Résistance des matériaux", "Topographie", "Métré", "Atelier de construction"],
  Électricité: ["Électricité générale", "Électronique", "Installations électriques", "Dessin technique", "Machines électriques", "Travaux pratiques"],
  Mécanique: ["Mécanique générale", "Technologie", "Dessin technique", "Moteurs", "Métrologie", "Travaux pratiques"],
  "Chimie industrielle": ["Chimie industrielle", "Technologie chimique", "Laboratoire", "Mathématiques appliquées", "Sécurité industrielle"],
  "Agriculture et agronomie": ["Agronomie", "Zootechnie", "Techniques agricoles", "Économie rurale", "Phytotechnie", "Travaux pratiques"],
  "Mines et géologie": ["Géologie", "Exploitation minière", "Topographie", "Minéralogie", "Sécurité minière", "Travaux pratiques"],
};

export function subjectsForClass(cycle: string, option = "", level = "") {
  if (cycle === "Maternelle") return maternelle;
  if (cycle === "Primaire") {
    if (!level) return Array.from(new Set([...primaireElementaire, ...primaireMoyen, ...primaireTerminal]));
    if (/^[12]/.test(level)) return primaireElementaire;
    if (/^[34]/.test(level)) return primaireMoyen;
    return primaireTerminal;
  }
  if (cycle === "Éducation de base" || cycle === "Ã‰ducation de base") return educationBase;
  if (cycle === "Humanités" || cycle === "HumanitÃ©s") return [...humanitesCommun, ...(optionSubjects[option] ?? [])];
  return [...humanitesCommun, ...(optionSubjects[option] ?? [])];
}

export function subjectCode(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, "_").toUpperCase().slice(0, 20);
}

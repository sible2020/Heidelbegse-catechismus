export interface QuestionAnswer {
  vraag: string;
  antwoord: string;
  nummer: number;
}

export interface SundayContent {
  zondag: number;
  titel: string;
  vragen: QuestionAnswer[];
}

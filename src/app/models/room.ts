import { Player } from "./player";

export interface Room {
    roomId: string;
    currentQuestionIndex: number;
    status: string; // affichage + event
    quizId: string;
    players: Player[];
    currentEvent: {
        eventTimestamp: number;
        data: any;
    };
}
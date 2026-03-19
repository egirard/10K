/** Die face value, 1 through 6 */
export type DieValue = 1 | 2 | 3 | 4 | 5 | 6;

/** An array of die values representing a roll or selection */
export type Roll = DieValue[];

/** A single scoring component within a breakdown */
export interface ScoreComponent {
  /** The dice values that form this scoring combination */
  dice: DieValue[];
  /** Points awarded for this combination */
  points: number;
  /** Human-readable description, e.g., "Three 4s", "Single 1", "Straight" */
  description: string;
}

/** Complete breakdown of how a score was calculated */
export interface ScoreBreakdown {
  /** Total points for all components combined */
  total: number;
  /** Individual scoring combinations that make up the total */
  components: ScoreComponent[];
  /** Indices in the original roll array that are scoring dice */
  scoringDiceIndices: number[];
}

/** Turn phases as a finite state machine */
export type TurnPhase =
  | 'START'       // Beginning of turn, no dice rolled yet
  | 'ROLLING'     // Dice are being rolled (animation phase in future)
  | 'ROLLED'      // Dice landed, awaiting player action
  | 'SELECTING'   // Player is choosing which scoring dice to keep
  | 'FARKLED'     // No scoring dice -- turn over, lose points
  | 'HOT_DICE'    // All 6 dice scored -- must roll again
  | 'BANKED';     // Player chose to bank -- turn over, keep points

/** Complete state of a turn */
export interface TurnState {
  /** Current phase of the turn */
  phase: TurnPhase;
  /** How many dice are available to roll */
  availableDice: number;
  /** The current throw's dice values */
  currentRoll: Roll;
  /** Indices of dice selected from currentRoll this throw */
  selectedDiceIndices: number[];
  /** Points from dice selected this throw */
  throwScore: number;
  /** Points accumulated across all throws this turn (not yet banked) */
  accumulatedScore: number;
  /** Total dice set aside across all throws this turn (for hot dice tracking) */
  totalDiceSetAside: number;
  /** How many throws so far this turn */
  throwsThisTurn: number;
  /** Whether the player has previously met the entry threshold */
  isOnBoard: boolean;
  /** Points required to get on the board (default 800) */
  entryThreshold: number;
}

/** Result of attempting a turn action */
export interface TurnActionResult {
  /** Whether the action was valid */
  valid: boolean;
  /** Updated turn state after the action */
  state: TurnState;
  /** Error message if action was invalid */
  error?: string;
  /** Points banked (only set when phase transitions to BANKED) */
  pointsBanked?: number;
}

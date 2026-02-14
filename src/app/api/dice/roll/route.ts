// POST /api/dice/roll — Server-side dice rolling (anti-cheat)
import { NextRequest } from 'next/server';
import { rollDiceSchema } from '@/lib/validations';
import { apiSuccess, handleApiError, requireAuth, validateBody, serverRollDice } from '@/lib/api-utils';

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const data = await validateBody(req, rollDiceSchema);

    const result = serverRollDice(data.formula);

    return apiSuccess({
      formula: data.formula,
      label: data.label,
      characterName: data.characterName,
      ...result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

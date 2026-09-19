export function purchaseScenario(price: number | null, budget: number, target: number, days: number, dailyCost: number) {
  if (price == null || price <= 0) return null;
  if (![budget,target,days,dailyCost].every(Number.isFinite) || budget <= 0 || target <= 0 || days < 0 || dailyCost < 0) return null;
  const saving = price - target;
  const waitingCost = days * dailyCost;
  const netSaving = saving - waitingCost;
  const affordable = price <= budget;
  const title = !affordable ? 'El precio supera tu presupuesto' : target >= price ? 'Tu objetivo ya está alcanzado' : days === 0 ? 'Comprar ahora cabe en tu presupuesto' : target > budget ? 'Tu objetivo también supera el presupuesto' : netSaving > 0 ? 'Esperar compensaría si llega a tu objetivo' : 'La espera costaría más que el ahorro';
  return {saving,waitingCost,netSaving,affordable,title,remaining:budget-price,breakEvenDays:dailyCost>0?Math.max(0,saving/dailyCost):null};
}

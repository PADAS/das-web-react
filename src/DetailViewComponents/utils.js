export const areCardsEquals = (cardExpanded, card) => card?.tmpId ? card.tmpId === cardExpanded.tmpId : card?.id === cardExpanded?.id;

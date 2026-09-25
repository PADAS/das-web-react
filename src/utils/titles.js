// A blank title reads as none, so the item goes by its type, and the type only
// shows below a title that is not already it.
export const calcTitleAndSubtitle = (title, typeTitle) => {
  const displayTitle = title?.trim() ? title : typeTitle ?? '';
  const isTypeTitle = !!typeTitle && displayTitle.trim() === typeTitle.trim();

  return { subtitle: typeTitle && !isTypeTitle ? typeTitle : null, title: displayTitle };
};

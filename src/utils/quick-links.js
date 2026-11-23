// The admin may set only a quick link's name; its title is an optional attribute.
export const getQuickLinkTitle = (quickLink) => quickLink.title || quickLink.name;

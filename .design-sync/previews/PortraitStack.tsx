import { PortraitStack } from "log-log-legends-kit";

const pages = ["Storm (Marvel Comics)", "Hulk", "Cyclops (Marvel Comics)", "Wolverine (character)", "Black Widow (Natasha Romanova)", "Black Cat (Marvel Comics)", "Hercules (Marvel Comics)"];

// Five faces, then "+2" for the rest.
export const Seven = () => <PortraitStack pages={pages} />;

export const Three = () => <PortraitStack pages={pages.slice(0, 3)} size="m" />;

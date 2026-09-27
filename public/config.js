// ---------------------------------------------------------------------------
//  Roulette Dealer Companion - Konfiguration
//
//  Vor der Party anpassen, dann am Tablet die Seite neu laden. Mehr ist nicht
//  noetig: kein Build, kein Neustart des Containers.
//
//  Ein ungueltiger Wert kann die App nicht lahmlegen - sie startet dann mit
//  dem Standardwert und zeigt oben eine Warnung mit dem Namen des Feldes.
// ---------------------------------------------------------------------------
window.ROULETTE_CONFIG = {
  baseStakeOutside: 10, // ein Tap auf eine Aussenwette (Rot, Dutzend, ...)
  baseStakeNumber: 5, // ein Tap auf eine Innenwette: Zahl (0-36) oder Linie (Split, Street, Corner, ...)
  currencySymbol: "€", // wird hinter jeden Betrag gesetzt
  historyLength: 10, // Laenge der Zahlen-Historie; 0 blendet sie aus
  lineBets: true, // Wetten auf den Linien anbieten; false = Tableau ohne Linienwetten
  orientation: "horizontal", // "horizontal" = Tableau quer (Breitbild), "vertical" = senkrecht wie am Tisch
};

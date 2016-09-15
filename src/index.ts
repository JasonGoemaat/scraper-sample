// workspace setting to use local typescript version instead of vscode installed
// 1.8.10 version
// https://code.visualstudio.com/docs/languages/typescript#_using-newer-typescript-versions

import { WowBattlePetScraper } from './lib/WowBattlePetScraper';

new WowBattlePetScraper().scrape()
.then((x: WowBattlePetScraper) => {
    console.error('resolved!');
    var o = {
        pets: x.pets.pets,
        zones: x.zones.zones,
        continents: x.continents
    };
    console.error('Continents:', o.continents.length);
    console.error('Zones:', o.zones.length);
    console.error('Pets:', o.pets.length);

    //console.log(JSON.stringify(o, null, 2));
    //console.log(x.getPetsAndHighestZones(true));
    console.log(x.getAllPetsAndHighestZones());
}, y => {
    console.log('rejected!');
});


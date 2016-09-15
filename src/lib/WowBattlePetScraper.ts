// note: npm install --save @types/request @types/cheerio

import * as request from 'request';
import * as cheerio from 'cheerio';
import * as colors from 'colors';

import { Pet, PetList, Zone, ZoneList } from './Pet';

// function log(message?: any, ...args) {
//     console.log('DEBUG: ' + message, args);
// };

export class debug {
    static log(message?: any, ...args): void {
    }

    static error(message?: any, ...args): void {
        console.error(message, ...args);
    }
}

export class WowBattlePetScraper {
    scrape(): Promise<any> {
        this.zones = new ZoneList();
        this.pets = new PetList();
        this.continents = [];
        this.continentsCompleted = 0;

        return new Promise<any>((resolve, reject) => {
            this.getContinentList(resolve, reject);
        });
    }

    continents: string[] = [];
    continentsCompleted: number = 0;
    pets: PetList;
    zones: ZoneList;

    getContinent(index: number, resolve: any, reject: any): void {
        var continentName = this.continents[index];
        var coloredContinentName = colors.blue(continentName);
        var url = `http://www.warcraftpets.com/guides/pets/wow-pets-by-zone/?continent=${continentName}&zone=&wild=Y`;
        request({ method: 'GET', gzip: true, uri: url }, (err, response, body) => {
            var $ = cheerio.load(body);

            // ---------- first we populate zones ----------
            debug.log(`Continent: ${coloredContinentName}`);

            // store zones and level range (character and pet)
            $('form[name="zoneform"] select:nth-child(2) option').each((index, element) => {
                //debug.log('  zone:', index);
                var zoneElement = $(element);
                var value = zoneElement.attr('value');
                var text = zoneElement.text();
                if (value && !text.startsWith('-')) {
                    var coloredZoneName = colors.green(value);
                    this.zones.ensure(continentName, value, text);
                    debug.log(`  Zone: ${coloredZoneName}`);
                }
            });

            // now add pets, just pet name and zone name is all we use,
            // pets will have lists of zones, we can lookup zones
            // to find pet levels
            $('div.catlist-container div.inner').each((index, element) => {
                var petElement = $(element);
                var zoneNames = [];
                var petName = petElement.find('a.pet-link').attr('title');
                petElement.find('div.pet-source p a.zonewithpets').each((indexB, elementB) => {
                    var e = $(elementB);
                    zoneNames.push(e.text());
                });
                //debug.error(`\tPet ${petName} zones: ${zoneNames.length}`);

                var pet: Pet = new Pet();
                pet.name = petName;
                pet.zones = zoneNames;
                this.pets.ensure(pet);
            });

            this.continentsCompleted++;
            debug.error(colors.magenta(`DONE ${this.continentsCompleted} of ${this.continents.length}`));
            if (this.continentsCompleted >= this.continents.length) {
                debug.error('resolving, zone count is:', this.zones.zones.length);
                resolve(this);
            }
        });
    }

    getContinentList(resolve, reject): void {
        // http://www.warcraftpets.com/guides/pets/wow-pets-by-zone/?wild=Y
        var url = "http://www.warcraftpets.com/guides/pets/wow-pets-by-zone/?wild=Y";
        request({ method: 'GET', gzip: true, uri: url }, (err, response, body) => {
            var $ = cheerio.load(body);
            this.continents = [];
            $('form[name="zoneform"]').find('select').find('option').each((index, element) => {
                var continent = $(element).text();
                if (continent && !continent.startsWith('-')) {
                    this.continents.push(continent);
                    debug.log('Found Continent:', continent);
                }
            });

            for (var i = 0; i < this.continents.length; i++) {
                this.getContinent(i, resolve, reject);
            }
        });
    }

    /**
     * List all pets sorted by name in tab-separated line containing:
     * <ul>
     *  <li>Name</li>
     *  <li>Max Wild Level</li>
     *  <li>Max Wild Zone</li>
     * </ul>
     * 
     * @param {boolean} allZones if true, one line per zone that has it at max level
     */
    getPetsAndHighestZones(allZones: boolean = false): string {
        var lines: string[] = [];
        var names = Object.keys(this.pets.petsByName).sort();
        console.error('Pet names:', names.length);
        names.forEach((name, index, arr) => {
            let pet: Pet = this.pets.petsByName[name];
            let zone: Zone = undefined;
            debug.log('pet:', pet.name);
            pet.zones.forEach((zoneName) => {
                let z: Zone = this.zones.zonesByName[zoneName];
                if (z) {
                    debug.log('  zone:', z.name);
                    if (zone == undefined || z.maxPetLevel > zone.maxPetLevel) {
                        zone = z;
                    }
                }
            });
            if (zone) {
                if (allZones) {
                    pet.zones.forEach((zoneName) => {
                        let z: Zone = this.zones.zonesByName[zoneName];
                        if (z && z.maxPetLevel == zone.maxPetLevel) {
                            lines.push(`${pet.name}\t${z.maxPetLevel}\t${z.name}`);
                        }
                    });
                } else {
                    lines.push(`${pet.name}\t${zone.maxPetLevel}\t${zone.name}`);
                }
            } else {
                lines.push(`${pet.name}\t0\tNO ZONE FOUND!`);
                debug.error(colors.red('  NO ZONE!'));
            }
        });

        debug.log('lines:', lines.length);
        return lines.join('\r\n');
    }

    /**
     * Return one of the highest level zones where a pet can be found.
     */
    getHighestPetZone(petName: string): Zone {
        let pet: Pet = this.pets.petsByName[petName];
        let zone: Zone = undefined;
        pet.zones.forEach((zoneName) => {
            let z: Zone = this.zones.zonesByName[zoneName];
            if (!zone || zone.maxPetLevel < z.maxPetLevel) {
                zone = z;
            }
        });
        return zone;
    }


    /**
     * List all pet/zone combinations, along with a higher level and zone where
     * it can be found if the current zone doesn't have the highest level ones.
     * <ul>
     *  <li>Zone</li>
     *  <li>Name</li>
     *  <li>Level</li>
     *  <li>Max Wild Level</li>
     *  <li>Max Wild Zone</li>
     * </ul>
     */
    getAllPetsAndHighestZones(): string {
        var lines: string[] = [];
        var names = Object.keys(this.pets.petsByName).sort();
        console.error('Pet names:', names.length);
        names.forEach((name, index, arr) => {
            let pet: Pet = this.pets.petsByName[name];
            pet.zones.forEach(zoneName => {
                let zone: Zone = this.zones.zonesByName[zoneName];
                let maxZone = this.getHighestPetZone(pet.name);
                if (maxZone.maxPetLevel > zone.maxPetLevel) {
                    lines.push(`${zone.name}\t${pet.name}\t${zone.maxPetLevel}\t${maxZone.maxPetLevel}\t${maxZone.name}`);
                } else {
                    // current zone is highest
                    lines.push(`${zone.name}\t${pet.name}\t${zone.maxPetLevel}`);
                }
            });
        });

        debug.log('lines:', lines.length);
        return lines.join('\r\n');
    }
}


/*

Weird zones:

// semicolon and 70+?
<option value="Ghostlands">Ghostlands (10 - 20; 70+) - pet level 3 - 6</option>

// JUST one level for zone and plus sign (70+), only one pet level
<option value="Isle of Quel'Danas">Isle of Quel'Danas (70+) - pet level 20</option>

// NEED TO FIX: 
<option value="Shadowmoon Valley (Draenor)">Shadowmoon Valley (Draenor) (90 - 93) - pet level 23 - 25</option>

// crap, still need:
<option value="Dalaran (Broken Isles)">Dalaran (Broken Isles) (Capital City) - pet level 25</option>


*/
import { debug } from './WowBattlePetScraper';


export class Pet {
    name: string;
    zones: string[];
}

export class Zone {
    name: string;
    continent: string;
    minCharacterLevel: number;
    maxCharacterLevel: number;
    minPetLevel: number;
    maxPetLevel: number;
}

export class PetList {
    pets: Pet[] = [];
    petsByName: any = {};

    ensure(pet: Pet): void {
        if (this.petsByName[pet.name]) {
            // TODO: check that data is the same
            return;
        }
        this.pets.push(pet);
        this.petsByName[pet.name] = pet;
    }
}

export class ZoneList {
    zones: Zone[] = [];
    zonesByName: any = {};

    //rZoneDescription = /([^\(]+)\s\(([^\)]+)\)\s\-\spet level (.+)/;
    rZoneDescription = /([^\(]+)\s\(([^\)]+)\)\s\-\s.*pet level ([^<]+)/;
    rZoneDescriptionB = /([^\(]+\s\([a-zA-Z\s]+\))\s\(([^\)]+)\)\s\-\s.*pet level ([^<]+)/; // for zones with () like 'Shadowmoon Valley (Draenor)', if no match, try original
    rMultiLevel = /(\d+) - (\d+)/;
    rSingleLevel = /(\d+)/;

    ensure(continent, name, text): void {
        // ensure (add, verify) that a zone exists and create given the details
        // from an option from the zone 'select' list.  Normal has level range
        // ala (25 - 30), but can be minimum ala (70+), or list ala (10 - 20; 70+)
        // 
        //      <option value="Wetlands">Wetlands (25 - 30) - pet level 6 - 7</option>
        //      <option value="Isle of Quel'Danas">Isle of Quel'Danas (70+) - pet level 20</option>
        //      can have list as in <option value="Ghostlands">Ghostlands (10 - 20; 70+) - pet level 3 - 6</option>

        var matches = text.match(this.rZoneDescriptionB) || text.match(this.rZoneDescription);
        if (!matches) { debug.log('\tNO MATCHES!', text); return; }
        if (matches.length < 3) { debug.log('\tNOT ENOUGH MATCHES!', text); return; }

        var zoneName = matches[1];
        var minC = 0, maxC = 0, minP = 0, maxP = 0;
        var levels = matches[2].match(this.rMultiLevel);
        if (levels) {
            minC = Number(levels[1]);
            maxC = Number(levels[2]);
        } else {
            levels = matches[2].match(this.rSingleLevel);
            if (!levels) {
                debug.log('\tNOT ENOUGH LEVELS!', text);
                // might be '(Capital City)', so continue
            } else {
                minC = maxC = Number(levels[1]);
            }
        }
        levels = matches[3].match(this.rMultiLevel);
        if (levels) {
            minP = Number(levels[1]);
            maxP = Number(levels[2]);
        } else {
            levels = matches[3].match(this.rSingleLevel);
            if (!levels) { debug.log('\tNOT ENOUGH LEVELS!', text); return; }
            minP = maxP = Number(levels[1]);
        }

        var zone: Zone = new Zone();
        zone.name = zoneName;
        zone.continent = continent;
        zone.minCharacterLevel = minC;
        zone.maxCharacterLevel = maxC;
        zone.minPetLevel = minP;
        zone.maxPetLevel = maxP;
        
        var existing = this.zonesByName[zone.name];
        if (existing) {
            // zone exist, validate details
            return;
        }

        this.zones.push(zone);
        this.zonesByName[zone.name] = zone;

        //debug.log(`\t${zoneName}: Char ${minC} - ${maxC}, Pet ${minP} - ${maxP}`);
    }
}


/*
Sample code:

var zones = ['Wetlands (25 - 30) - pet level 6 - 7',
"Isle of Quel'Danas (70+) - pet level 20",
'Ghostlands (10 - 20; 70+) - pet level 3 - 6',
'The Lost Isles (1 - 12) - <em>pet level 1 - 2</em>'];

var rMain = /([^\(]+)\s\(([^\)]+)\)\s\-\spet level (.+)/;

zones.forEach(x => console.log(x.match(/([^\(]+)\s\(([^\)]+)\)\s\-\spet level (.+)/)))

// ok, calling zoneName.match(rMain) teturns array
    [0]: full matched string
    [1]: zone name (should be same as value)
    [2]: character level(s)
    [3]: pet level(s)



*/
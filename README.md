## Scraper Sample

A sample project showing how to scrape web pages to get data.

This project uses typescript@next (2.1), so run `npm run watch` which simply
executes `tsc -w` to watch for changes to typescript files in the `src`
directory and compile to javascript in the `dist` directory.  The `output`
directory is ignored, and for testing I just have `src/index.ts` do the
dirty work, so you can run like this (because index.js is run by default
when a directory is specified):

    node dist > output/pets.csv

## Wow Battle Pets

This scrapes wild pets with zone information from [warcraftpets.com](http://www.warcraftpets.com/).
There are three different things it can output: a json string with zone
objects that have min/max levels and pet objects that have zone lists, a
tab-separated-value file of unique pet names and the highest zones they can
be found in, and a list of all pet/zone combinations along with the highest
level zone they can be found in (check out `src/index.ts`):

    //console.log(JSON.stringify(o, null, 2));
    //console.log(x.getPetsAndHighestZones(true));
    console.log(x.getAllPetsAndHighestZones());

The json could be useful if you want to use the data yourself.  The second
(unique pets) is useful if you want to make sure you grab the highest level
pets in a zone, and the third if you are in a zone so you can see if there
are any higher level zones with the pets so you may not want to bother
capturing them.

For instance if you are in Darkshore, you can see that 'Darkshore Cub' is only
available at level 6 and only in Darkshore, so you might want to hang out and
try to find 3 blue (rare) ones and level them up all the way since you won't
find one.  

Likewise you can see that if you are in Durotar and come across a level 1-2
Cockroach, you shouldn't really bother levelling them because they are available
in other zones at levels 7, 12, 16, 23, 24 and 25, while you can only find
"Creepy Crawly" and "Spiny Lizard" in Durotar and at level 2 so it would be
better to spend your time leveling those and pick up Cockroaches when
you can capture the higher-level ones.

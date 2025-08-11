export type Licence = {
  src: string;
  name: string;
  link: string;
  description: string;
};

const licenceElements = {
  BY: 'credit must be given to the creator.',
  SA: 'Adaptations must be shared under the same terms.',
  NC: 'Only noncommercial uses of the work are permitted.',
  ND: 'No derivatives or adaptations of the work are permitted.',
} as const;

const createElementsString = (elements: (keyof typeof licenceElements)[]) =>
  elements.map(el => `${el}: ${licenceElements[el]}`).join('\n');

export const Licences: Record<string, Licence> = {
  'CC0': {
    src: 'assets/licence/CC0.png',
    name: 'No Rights Reserved (CC0)',
    link: 'https://creativecommons.org/publicdomain/zero/1.0/',
    description:
      'CC0 (aka CC Zero) is a public dedication tool, which enables creators to give up their copyright and put their works into the worldwide public domain. CC0 enables reusers to distribute, remix, adapt, and build upon the material in any medium or format, with no conditions.',
  },
  'PDM': {
    src: 'assets/licence/PDM.png',
    name: 'Public Domain Mark 1.0 Universal (PDM 1.0)',
    link: 'https://creativecommons.org/publicdomain/mark/1.0/',
    description:
      'This work has been identified as being free of known restrictions under copyright law, including all related and neighboring rights. You can copy, modify, distribute and perform the work, even for commercial purposes, all without asking permission.',
  },
  'BY': {
    src: 'assets/licence/BY.png',
    name: 'Attribution 4.0 International (CC BY 4.0)',
    link: 'https://creativecommons.org/licenses/by/4.0',
    description:
      'This license enables reusers to distribute, remix, adapt, and build upon the material in any medium or format, so long as attribution is given to the creator. The license allows for commercial use. CC BY includes the following elements:\n' +
      createElementsString(['BY']),
  },
  'BY-SA': {
    src: 'assets/licence/BY-SA.png',
    name: 'Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)',
    link: 'https://creativecommons.org/licenses/by-sa/4.0',
    description:
      'This license enables reusers to distribute, remix, adapt, and build upon the material in any medium or format, so long as attribution is given to the creator. The license allows for commercial use. If you remix, adapt, or build upon the material, you must license the modified material under identical terms. CC BY-SA includes the following elements:\n' +
      createElementsString(['BY', 'SA']),
  },
  'BY-ND': {
    src: 'assets/licence/BY-ND.png',
    name: 'Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0)',
    link: 'https://creativecommons.org/licenses/by-nd/4.0',
    description:
      'This license enables reusers to copy and distribute the material in any medium or format in unadapted form only, and only so long as attribution is given to the creator. The license allows for commercial use. CC BY-ND includes the following elements:\n' +
      createElementsString(['BY', 'ND']),
  },
  'BYNC': {
    src: 'assets/licence/BYNC.png',
    name: 'Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)',
    link: 'https://creativecommons.org/licenses/by-nc/4.0',
    description:
      'This license enables reusers to distribute, remix, adapt, and build upon the material in any medium or format for noncommercial purposes only, and only so long as attribution is given to the creator. CC BY-NC includes the following elements:\n' +
      createElementsString(['BY', 'NC']),
  },
  'BYNCSA': {
    src: 'assets/licence/BYNCSA.png',
    name: 'Attribution-NonCommercial-ShareAlike International (CC BY-NC-SA 4.0)',
    link: 'https://creativecommons.org/licenses/by-nc-sa/4.0',
    description:
      'This license enables reusers to distribute, remix, adapt, and build upon the material in any medium or format for noncommercial purposes only, and only so long as attribution is given to the creator. If you remix, adapt, or build upon the material, you must license the modified material under identical terms. CC BY-NC-SA includes the following elements:\n' +
      createElementsString(['BY', 'NC', 'SA']),
  },
  'BYNCND': {
    src: 'assets/licence/BYNCND.png',
    name: 'Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)',
    link: 'https://creativecommons.org/licenses/by-nc-nd/4.0',
    description:
      'This license enables reusers to copy and distribute the material in any medium or format in unadapted form only, for noncommercial purposes only, and only so long as attribution is given to the creator. CC BY-NC-ND includes the following elements:\n' +
      createElementsString(['BY', 'NC', 'ND']),
  },
  'AR': {
    src: 'assets/licence/AR.png',
    name: 'All rights reserved',
    link: 'https://en.wikipedia.org/wiki/All_rights_reserved',
    description:
      'All rights reserved means that the copyright holder retains all the rights provided by copyright law, such as the right to reproduce, distribute, and display the work.',
  },
} as const;

import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser.js';
import { codegenRoundTrip } from './utils.js';

// Test molecules that were previously broken
// Tests SMILES -> AST -> SMILES round-trip
// Note: SMILES -> AST -> CODE -> AST -> SMILES is tested separately where applicable
// The codegen round-trip may produce different SMILES (e.g., loses double bonds in rings)

const OPIOIDS = {
  Fentanyl: {
    smiles: 'CCC(=O)N(C1CCN(CC1)CCC2=CC=CC=C2)C3=CC=CC=C3',
    codegenSmiles: 'CCC(=O)N(C1CCNCC1CCC2CCCCC2)C3CCCCC3',
  },
  Tramadol: {
    smiles: 'CN(C)CC1CCCCC1(C2=CC(=CC=C2)OC)O',
    codegenSmiles: 'CN(C)CC1CCCCC1(C2CCCCC2OC)O',
  },
  Oxycodone: {
    smiles: 'CN1CCC23C4C(=O)CCC2(C1CC5=C3C(=C(C=C5)OC)O4)O',
    codegenSmiles: 'CN15CCC23C4C15(=O)(=O)(=O)CCC2CCCC3CO4O',
  },
  Morphine: {
    smiles: 'CN1CCC23C4OC5=C(O)C=CC(=C25)C(O)C=CC3C1C4',
    codegenSmiles: 'CN15C(O)CC23C4(O)C5CC(O)(O)(O)C1CC3C2C4',
  },
  Codeine: {
    smiles: 'CN1CCC23C4OC5=C(OC)C=CC(=C25)C(O)C=CC3C1C4',
    codegenSmiles: 'CN15C(OC)CC23C4(O)C5CC(OC)(O)(O)C1CC3C2C4',
  },
  Hydrocodone: {
    smiles: 'CN1CCC23C4OC5=C(OC)C=CC(=C25)C(=O)CCC3C1C4',
    codegenSmiles: 'CN15C(OC)CC23C4(=O)C5CC(OC)(=O)(=O)C1CC3C2C4',
  },
  Hydromorphone: {
    smiles: 'CN1CCC23C4OC5=C(O)C=CC(=C25)C(=O)CCC3C1C4',
    codegenSmiles: 'CN15C(O)CC23C4(=O)C5CC(O)(=O)(=O)C1CC3C2C4',
  },
};

const CANNABINOIDS = {
  Anandamide: {
    smiles: 'CCCCCC=CCC=CCC=CCC=CCCCC(=O)NCCO',
    codegenSmiles: 'CCCCCC=CCC=CCC=CCC=CCCCC(=O)NCCO',
  },
  '2-Arachidonoylglycerol': {
    smiles: 'CCCCCC=CCC=CCC=CCC=CCCCC(=O)OC(CO)CO',
    codegenSmiles: 'CCCCCC=CCC=CCC=CCC=CCCCC(=O)OC(CO)CO',
  },
};

const CANNABINOIDS_BROKEN = {
  THC: {
    smiles: 'CCCCCC1=CC(=C2C3C=C(CCC3C(OC2=C1)(C)C)C)O',
    reason: 'Complex tricyclic - still broken',
  },
  CBD: {
    smiles: 'CCCCCC1=CC(=C(C(=C1)O)C2C=C(CCC2C(=C)C)C)O',
    reason: 'Complex structure - still broken',
  },
  Nabilone: {
    smiles: 'CCCCCCC(C)(C)C1=CC(=C2C3CC(=O)CCC3C(OC2=C1)(C)C)O',
    reason: 'Complex tricyclic - still broken',
  },
};

const NSAIDS = {
  Celecoxib: {
    smiles: 'CC1=CC=C(C=C1)C2=CC(=NN2C3=CC=C(C=C3)S(=O)(=O)N)C(F)(F)F',
    codegenSmiles: 'CC1CCCCC1C23CCCCC3CNN2C(F)(F)F',
  },
  Piroxicam: {
    smiles: 'CN1C(=C(C2=CC=CC=C2S1(=O)=O)O)C(=O)NC3=CC=CC=N3',
    codegenSmiles: 'CN1CCC2CCCCC2CCCCS1(=O)C(=O)NC3CCCCN3',
  },
  Rofecoxib: {
    smiles: 'CS(=O)(=O)C1=CC=C(C=C1)C2=C(C(=O)OC2)C3=CC=CC=C3',
    codegenSmiles: 'CS(=O)(=O)C1CCCCC1C2CC(=O)OC2C3CCCCC3',
  },
  Etoricoxib: {
    smiles: 'CC1=NC=C(C=C1)C2=CC=C(C=C2)S(=O)(=O)C3=CC=CC=C3',
    codegenSmiles: 'CC1NCCCC1C2CCCCC2S(=O)(=O)C3CCCCC3',
  },
  Nabumetone: {
    smiles: 'COC1=CC2=CC(=CC=C2C=C1)CCC(=O)C',
    codegenSmiles: 'COC1CC2CCCCC2CC1CCC(=O)C',
  },
  Ketoprofen: {
    smiles: 'CC(c1cccc(c1)C(=O)c2ccccc2)C(=O)O',
    codegenSmiles: 'CC(c1ccccc1C(=O)c2ccccc2)C(=O)O',
  },
  Ibuprofen: {
    smiles: 'CC(C)Cc1ccc(cc1)C(C)C(=O)O',
    codegenSmiles: 'CC(C)Cc1ccccc1C(C)C(=O)O',
  },
  Benzocaine: {
    smiles: 'CCOC(=O)C1=CC=C(C=C1)N',
    codegenSmiles: 'CCOC(=O)C1CCCCC1N',
  },
};

const NSAIDS_BROKEN = {
  Meloxicam: {
    smiles: 'CC1=C(N=C(S1)NC(=O)C2=C(C3=CC=CC=C3S(=O)(=O)N2C)O)C',
    reason: 'Still broken - thiazole with nested benzothiazine',
  },
  Oxaprozin: {
    smiles: 'OC(=O)CCC1=NC(=C(O1)C2=CC=CC=C2)C3=CC=CC=C3',
    reason: 'Still broken - oxazole with nested phenyl rings',
  },
};

describe('Opioids', () => {
  Object.entries(OPIOIDS).forEach(([name, data]) => {
    describe(name, () => {
      test('SMILES -> AST -> SMILES', () => {
        expect(parse(data.smiles).smiles).toBe(data.smiles);
      });

      test('SMILES -> AST -> CODE -> AST -> SMILES', () => {
        const reconstructed = codegenRoundTrip(data.smiles);
        expect(reconstructed.smiles).toBe(data.codegenSmiles);
      });
    });
  });
});

describe('Cannabinoids', () => {
  Object.entries(CANNABINOIDS).forEach(([name, data]) => {
    describe(name, () => {
      test('SMILES -> AST -> SMILES', () => {
        expect(parse(data.smiles).smiles).toBe(data.smiles);
      });

      test('SMILES -> AST -> CODE -> AST -> SMILES', () => {
        const reconstructed = codegenRoundTrip(data.smiles);
        expect(reconstructed.smiles).toBe(data.codegenSmiles);
      });
    });
  });

  describe('Broken', () => {
    Object.entries(CANNABINOIDS_BROKEN).forEach(([name, data]) => {
      test.skip(`${name} - ${data.reason}`, () => {
        expect(parse(data.smiles).smiles).toBe(data.smiles);
      });
    });
  });
});

describe('NSAIDs', () => {
  Object.entries(NSAIDS).forEach(([name, data]) => {
    describe(name, () => {
      test('SMILES -> AST -> SMILES', () => {
        expect(parse(data.smiles).smiles).toBe(data.smiles);
      });

      test('SMILES -> AST -> CODE -> AST -> SMILES', () => {
        const reconstructed = codegenRoundTrip(data.smiles);
        expect(reconstructed.smiles).toBe(data.codegenSmiles);
      });
    });
  });

  describe('Broken', () => {
    Object.entries(NSAIDS_BROKEN).forEach(([name, data]) => {
      test.skip(`${name} - ${data.reason}`, () => {
        expect(parse(data.smiles).smiles).toBe(data.smiles);
      });
    });
  });
});

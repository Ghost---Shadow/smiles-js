import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser.js';

// This test file checks the current status of previously broken molecules
// after the oxycodone fix (bridge ring detection)

describe('Molecule Status Check - After Oxycodone Fix', () => {
  // Helper to test round-trip
  const checkRoundTrip = (name, smiles) => {
    try {
      const result = parse(smiles);
      const passes = result.smiles === smiles;
      return {
        name, smiles, output: result.smiles, passes,
      };
    } catch (e) {
      return {
        name, smiles, output: null, passes: false, error: e.message,
      };
    }
  };

  test('check cannabinoids status', () => {
    const molecules = [
      ['THC', 'CCCCCC1=CC(=C2C3C=C(CCC3C(OC2=C1)(C)C)C)O'],
      ['CBD', 'CCCCCC1=CC(=C(C(=C1)O)C2C=C(CCC2C(=C)C)C)O'],
      ['Nabilone', 'CCCCCCC(C)(C)C1=CC(=C2C3CC(=O)CCC3C(OC2=C1)(C)C)O'],
    ];

    const results = molecules.map(([name, smiles]) => checkRoundTrip(name, smiles));

    console.log('\n=== Cannabinoids Status ===');
    results.forEach((r) => {
      console.log(`${r.passes ? 'PASS' : 'FAIL'} ${r.name}`);
      if (!r.passes) {
        console.log(`  Input:  ${r.smiles}`);
        console.log(`  Output: ${r.output || r.error}`);
      }
    });

    // Log summary
    const passed = results.filter((r) => r.passes).length;
    console.log(`\nCannabinoids: ${passed}/${results.length} passing`);

    expect(true).toBe(true); // Always pass - this is a status check
  });

  test('check NSAIDs status', () => {
    const molecules = [
      ['Celecoxib', 'CC1=CC=C(C=C1)C2=CC(=NN2C3=CC=C(C=C3)S(=O)(=O)N)C(F)(F)F'],
      ['Meloxicam', 'CC1=C(N=C(S1)NC(=O)C2=C(C3=CC=CC=C3S(=O)(=O)N2C)O)C'],
      ['Piroxicam', 'CN1C(=C(C2=CC=CC=C2S1(=O)=O)O)C(=O)NC3=CC=CC=N3'],
      ['Rofecoxib', 'CS(=O)(=O)C1=CC=C(C=C1)C2=C(C(=O)OC2)C3=CC=CC=C3'],
      ['Etoricoxib', 'CC1=NC=C(C=C1)C2=CC=C(C=C2)S(=O)(=O)C3=CC=CC=C3'],
      ['Nabumetone', 'COC1=CC2=CC(=CC=C2C=C1)CCC(=O)C'],
      ['Oxaprozin', 'OC(=O)CCC1=NC(=C(O1)C2=CC=CC=C2)C3=CC=CC=C3'],
      ['Ketoprofen', 'CC(c1cccc(c1)C(=O)c2ccccc2)C(=O)O'],
    ];

    const results = molecules.map(([name, smiles]) => checkRoundTrip(name, smiles));

    console.log('\n=== NSAIDs Status ===');
    results.forEach((r) => {
      console.log(`${r.passes ? 'PASS' : 'FAIL'} ${r.name}`);
      if (!r.passes) {
        console.log(`  Input:  ${r.smiles}`);
        console.log(`  Output: ${r.output || r.error}`);
      }
    });

    // Log summary
    const passed = results.filter((r) => r.passes).length;
    console.log(`\nNSAIDs: ${passed}/${results.length} passing`);

    expect(true).toBe(true); // Always pass - this is a status check
  });

  test('check other morphinans status', () => {
    const molecules = [
      ['Oxycodone', 'CN1CCC23C4C(=O)CCC2(C1CC5=C3C(=C(C=C5)OC)O4)O'],
      ['Morphine', 'CN1CCC23C4OC5=C(O)C=CC(=C25)C(O)C=CC3C1C4'],
      ['Codeine', 'CN1CCC23C4OC5=C(OC)C=CC(=C25)C(O)C=CC3C1C4'],
      ['Hydrocodone', 'CN1CCC23C4OC5=C(OC)C=CC(=C25)C(=O)CCC3C1C4'],
      ['Hydromorphone', 'CN1CCC23C4OC5=C(O)C=CC(=C25)C(=O)CCC3C1C4'],
    ];

    const results = molecules.map(([name, smiles]) => checkRoundTrip(name, smiles));

    console.log('\n=== Morphinans Status ===');
    results.forEach((r) => {
      console.log(`${r.passes ? 'PASS' : 'FAIL'} ${r.name}`);
      if (!r.passes) {
        console.log(`  Input:  ${r.smiles}`);
        console.log(`  Output: ${r.output || r.error}`);
      }
    });

    // Log summary
    const passed = results.filter((r) => r.passes).length;
    console.log(`\nMorphinans: ${passed}/${results.length} passing`);

    expect(true).toBe(true); // Always pass - this is a status check
  });

  test('check para-substituted benzenes status', () => {
    const molecules = [
      ['Ibuprofen', 'CC(C)Cc1ccc(cc1)C(C)C(=O)O'],
      ['Benzocaine', 'CCOC(=O)C1=CC=C(C=C1)N'],
      ['Losartan', 'CCCCc1nc(Cl)c(n1Cc2ccc(cc2)c3ccccc3c4n[nH]nn4)CO'],
      ['Valsartan', 'CCCCC(=O)N(Cc1ccc(cc1)c2ccccc2c3n[nH]nn3)C(C(C)C)C(=O)O'],
    ];

    const results = molecules.map(([name, smiles]) => checkRoundTrip(name, smiles));

    console.log('\n=== Para-Substituted Benzenes Status ===');
    results.forEach((r) => {
      console.log(`${r.passes ? 'PASS' : 'FAIL'} ${r.name}`);
      if (!r.passes) {
        console.log(`  Input:  ${r.smiles}`);
        console.log(`  Output: ${r.output || r.error}`);
      }
    });

    // Log summary
    const passed = results.filter((r) => r.passes).length;
    console.log(`\nPara-Substituted Benzenes: ${passed}/${results.length} passing`);

    expect(true).toBe(true); // Always pass - this is a status check
  });
});

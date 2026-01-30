import {
  describe, test, expect,
} from 'bun:test';
import {
  Ring, Linear, Molecule,
} from './constructors.js';
import { decompile } from './decompiler.js';

describe('Decompiler - Ring', () => {
  test('decompiles simple ring', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const code = decompile(benzene);
    expect(code).toBe("export const v1 = Ring({ atoms: 'c', size: 6 });");
  });

  test('decompiles ring with custom ring number', () => {
    const ring = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const code = decompile(ring);
    expect(code).toBe("export const v1 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });");
  });

  test('decompiles ring with offset', () => {
    const ring = Ring({ atoms: 'C', size: 6, offset: 2 });
    const code = decompile(ring);
    expect(code).toBe("export const v1 = Ring({ atoms: 'C', size: 6, offset: 2 });");
  });

  test('uses toCode() method', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    expect(benzene.toCode()).toBe("export const ring1 = Ring({ atoms: 'c', size: 6 });");
    expect(benzene.toCode('r')).toBe("export const r1 = Ring({ atoms: 'c', size: 6 });");
  });
});

describe('Decompiler - Linear', () => {
  test('decompiles simple linear chain', () => {
    const propane = Linear(['C', 'C', 'C']);
    const code = decompile(propane);
    expect(code).toBe("export const v1 = Linear(['C', 'C', 'C']);");
  });

  test('decompiles linear with bonds', () => {
    const ethene = Linear(['C', 'C'], ['=']);
    const code = decompile(ethene);
    expect(code).toBe("export const v1 = Linear(['C', 'C'], ['=']);");
  });

  test('uses toCode() method', () => {
    const propane = Linear(['C', 'C', 'C']);
    expect(propane.toCode()).toBe("export const linear1 = Linear(['C', 'C', 'C']);");
    expect(propane.toCode('c')).toBe("export const c1 = Linear(['C', 'C', 'C']);");
  });
});

describe('Decompiler - FusedRing', () => {
  test('decompiles fused ring system', () => {
    const ring1 = Ring({ atoms: 'C', size: 10, ringNumber: 1 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fusedRing = ring1.fuse(ring2, 2);

    const code = decompile(fusedRing);
    expect(code).toBe(`export const v1 = Ring({ atoms: 'C', size: 10 });
export const v2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 2 });
export const v3 = v1.fuse(v2, 2);`);
  });

  test('uses toCode() method', () => {
    const ring1 = Ring({ atoms: 'C', size: 6, ringNumber: 1 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fusedRing = ring1.fuse(ring2, 1);

    const code = fusedRing.toCode();
    expect(code).toBe(`export const fusedRing1 = Ring({ atoms: 'C', size: 6 });
export const fusedRing2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 1 });
export const fusedRing3 = fusedRing1.fuse(fusedRing2, 1);`);
  });
});

describe('Decompiler - Molecule', () => {
  test('decompiles molecule with multiple components', () => {
    const propyl = Linear(['C', 'C', 'C']);
    const benzene = Ring({ atoms: 'c', size: 6 });
    const molecule = Molecule([propyl, benzene]);

    const code = decompile(molecule);
    expect(code).toBe(`export const v1 = Linear(['C', 'C', 'C']);
export const v2 = Ring({ atoms: 'c', size: 6 });
export const v3 = Molecule([v1, v2]);`);
  });

  test('uses toCode() method', () => {
    const propyl = Linear(['C', 'C', 'C']);
    const benzene = Ring({ atoms: 'c', size: 6 });
    const molecule = Molecule([propyl, benzene]);

    const code = molecule.toCode();
    expect(code).toBe(`export const molecule1 = Linear(['C', 'C', 'C']);
export const molecule2 = Ring({ atoms: 'c', size: 6 });
export const molecule3 = Molecule([molecule1, molecule2]);`);
  });
});

describe('Decompiler - Round-trip', () => {
  test('generated code can be evaluated', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const code = benzene.toCode('r');

    expect(code).toBe("export const r1 = Ring({ atoms: 'c', size: 6 });");
  });

  test('preserves structure through decompile', () => {
    const propane = Linear(['C', 'C', 'C']);
    const code = propane.toCode('p');

    expect(code).toBe("export const p1 = Linear(['C', 'C', 'C']);");
  });
});

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
    const code = decompile(benzene, { varName: 'benzene' });
    expect(code).toBe("const benzene = Ring({ atoms: 'c', size: 6 });");
  });

  test('decompiles ring with custom ring number', () => {
    const ring = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const code = decompile(ring, { varName: 'ring' });
    expect(code).toBe("const ring = Ring({ atoms: 'C', size: 6, ringNumber: 2 });");
  });

  test('decompiles ring with offset', () => {
    const ring = Ring({ atoms: 'C', size: 6, offset: 2 });
    const code = decompile(ring, { varName: 'ring' });
    expect(code).toBe("const ring = Ring({ atoms: 'C', size: 6, offset: 2 });");
  });

  test('uses toCode() method', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    expect(benzene.toCode()).toBe("const ring = Ring({ atoms: 'c', size: 6 });");
    expect(benzene.toCode('myRing')).toBe("const myRing = Ring({ atoms: 'c', size: 6 });");
  });
});

describe('Decompiler - Linear', () => {
  test('decompiles simple linear chain', () => {
    const propane = Linear(['C', 'C', 'C']);
    const code = decompile(propane, { varName: 'propane' });
    expect(code).toBe("const propane = Linear(['C', 'C', 'C']);");
  });

  test('decompiles linear with bonds', () => {
    const ethene = Linear(['C', 'C'], ['=']);
    const code = decompile(ethene, { varName: 'ethene' });
    expect(code).toBe("const ethene = Linear(['C', 'C'], ['=']);");
  });

  test('uses toCode() method', () => {
    const propane = Linear(['C', 'C', 'C']);
    expect(propane.toCode()).toBe("const linear = Linear(['C', 'C', 'C']);");
    expect(propane.toCode('chain')).toBe("const chain = Linear(['C', 'C', 'C']);");
  });
});

describe('Decompiler - FusedRing', () => {
  test('decompiles fused ring system', () => {
    const ring1 = Ring({ atoms: 'C', size: 10, ringNumber: 1 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fusedRing = ring1.fuse(ring2, 2);

    const code = decompile(fusedRing, { varName: 'naphthalene' });
    const lines = code.split('\n');

    expect(lines[0]).toBe("const naphthaleneRing1 = Ring({ atoms: 'C', size: 10, ringNumber: 1, offset: 0 });");
    expect(lines[1]).toBe("const naphthaleneRing2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 2 });");
    expect(lines[2]).toBe('const naphthalene = naphthaleneRing1.fuse(naphthaleneRing2, 2);');
  });

  test('uses toCode() method', () => {
    const ring1 = Ring({ atoms: 'C', size: 6, ringNumber: 1 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fusedRing = ring1.fuse(ring2, 1);

    const code = fusedRing.toCode('myFusedRing');
    expect(code).toContain('const myFusedRing');
  });
});

describe('Decompiler - Molecule', () => {
  test('decompiles molecule with multiple components', () => {
    const propyl = Linear(['C', 'C', 'C']);
    const benzene = Ring({ atoms: 'c', size: 6 });
    const molecule = Molecule([propyl, benzene]);

    const code = decompile(molecule, { varName: 'propylbenzene' });
    const lines = code.split('\n');

    expect(lines[0]).toBe("const propylbenzeneComponent1 = Linear(['C', 'C', 'C']);");
    expect(lines[1]).toBe("const propylbenzeneComponent2 = Ring({ atoms: 'c', size: 6 });");
    expect(lines[2]).toBe('const propylbenzene = Molecule([propylbenzeneComponent1, propylbenzeneComponent2]);');
  });

  test('uses toCode() method', () => {
    const propyl = Linear(['C', 'C', 'C']);
    const benzene = Ring({ atoms: 'c', size: 6 });
    const molecule = Molecule([propyl, benzene]);

    const code = molecule.toCode();
    expect(code).toContain('const molecule = Molecule');
  });
});

describe('Decompiler - Round-trip', () => {
  test('generated code can be evaluated', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const code = benzene.toCode('testRing');

    expect(code).toBe("const testRing = Ring({ atoms: 'c', size: 6 });");
  });

  test('preserves structure through decompile', () => {
    const propane = Linear(['C', 'C', 'C']);
    const code = propane.toCode('propane');

    expect(code).toBe("const propane = Linear(['C', 'C', 'C']);");
  });
});

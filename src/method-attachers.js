/**
 * Functions that attach manipulation methods and the smiles getter to AST nodes
 */

import { buildSMILES } from './codegen/index.js';
import { decompile } from './decompiler.js';
import { deepCloneLinear, deepCloneFusedRing, deepCloneMolecule } from './clone-utils.js';
import {
  ringAttach,
  ringSubstitute,
  ringSubstituteMultiple,
  ringFuse,
  ringConcat,
  ringClone,
  linearAttach,
  linearBranch,
  linearBranchAt,
  linearConcat,
  fusedRingAddRing,
  fusedRingGetRing,
  fusedRingSubstituteInRing,
  fusedRingAttachToRing,
  fusedRingRenumber,
  fusedRingConcat,
  fusedRingAddSequentialRings,
  fusedRingAddSequentialAtomAttachment,
  moleculeAppend,
  moleculePrepend,
  moleculeConcat,
  moleculeGetComponent,
  moleculeReplaceComponent,
} from './manipulation.js';

/**
 * SMILES getter function
 */
export function getSmiles() {
  return buildSMILES(this);
}

// Attach smiles getter to all node types
export function attachSmilesGetter(node) {
  Object.defineProperty(node, 'smiles', {
    get: getSmiles,
    enumerable: true,
    configurable: true,
  });
  return node;
}

// Attach manipulation methods to Ring nodes
export function attachRingMethods(node) {
  return Object.assign(node, {
    attach(position, attachment, options) {
      return ringAttach(this, position, attachment, options);
    },
    substitute(position, newAtom) {
      return ringSubstitute(this, position, newAtom);
    },
    substituteMultiple(substitutionMap) {
      return ringSubstituteMultiple(this, substitutionMap);
    },
    fuse(offset, otherRing) {
      return ringFuse(this, offset, otherRing);
    },
    concat(other) {
      return ringConcat(this, other);
    },
    clone() {
      return ringClone(this);
    },
    addSequentialRings(seqRings, options) {
      return fusedRingAddSequentialRings(this, seqRings, options);
    },
    toObject() {
      const result = {
        type: this.type,
        atoms: this.atoms,
        size: this.size,
        ringNumber: this.ringNumber,
        offset: this.offset,
        substitutions: { ...this.substitutions },
        attachments: {},
        bonds: [...(this.bonds || [])],
      };
      Object.entries(this.attachments).forEach(([pos, attachmentList]) => {
        result.attachments[pos] = attachmentList.map((a) => (a.toObject ? a.toObject() : a));
      });
      return result;
    },
    toCode(varName = 'ring') {
      return decompile(this, { varName });
    },
  });
}

// Attach manipulation methods to Linear nodes
export function attachLinearMethods(node) {
  return Object.assign(node, {
    attach(position, attachment) {
      return linearAttach(this, position, attachment);
    },
    branch(branchPoint, ...branches) {
      return linearBranch(this, branchPoint, ...branches);
    },
    branchAt(branchMap) {
      return linearBranchAt(this, branchMap);
    },
    concat(other) {
      return linearConcat(this, other);
    },
    clone() {
      return deepCloneLinear(this);
    },
    toObject() {
      const result = {
        type: this.type,
        atoms: [...this.atoms],
        bonds: [...this.bonds],
        attachments: {},
      };
      Object.entries(this.attachments).forEach(([pos, attachmentList]) => {
        result.attachments[pos] = attachmentList.map((a) => (a.toObject ? a.toObject() : a));
      });
      return result;
    },
    toCode(varName = 'linear') {
      return decompile(this, { varName });
    },
  });
}

// Attach manipulation methods to Molecule nodes
export function attachMoleculeMethods(node) {
  return Object.assign(node, {
    append(component) {
      return moleculeAppend(this, component);
    },
    prepend(component) {
      return moleculePrepend(this, component);
    },
    concat(other) {
      return moleculeConcat(this, other);
    },
    getComponent(index) {
      return moleculeGetComponent(this, index);
    },
    replaceComponent(index, newComponent) {
      return moleculeReplaceComponent(this, index, newComponent);
    },
    clone() {
      return deepCloneMolecule(this);
    },
    toObject() {
      return {
        type: this.type,
        components: this.components.map((c) => (c.toObject ? c.toObject() : c)),
      };
    },
    toCode(varName = 'molecule') {
      return decompile(this, { varName });
    },
  });
}

// Attach manipulation methods to FusedRing nodes
export function attachFusedRingMethods(node) {
  return Object.assign(node, {
    addRing(offset, ring) {
      return fusedRingAddRing(this, offset, ring);
    },
    getRing(ringNumber) {
      return fusedRingGetRing(this, ringNumber);
    },
    substituteInRing(ringNumber, position, newAtom) {
      return fusedRingSubstituteInRing(this, ringNumber, position, newAtom);
    },
    attachToRing(ringNumber, position, attachment) {
      return fusedRingAttachToRing(this, ringNumber, position, attachment);
    },
    renumber(startNumber = 1) {
      return fusedRingRenumber(this, startNumber);
    },
    addSequentialRings(seqRings, options) {
      return fusedRingAddSequentialRings(this, seqRings, options);
    },
    addSequentialAtomAttachment(position, attachment) {
      return fusedRingAddSequentialAtomAttachment(this, position, attachment);
    },
    concat(other) {
      return fusedRingConcat(this, other);
    },
    clone() {
      return deepCloneFusedRing(this);
    },
    toObject() {
      return {
        type: this.type,
        rings: this.rings.map((r) => (r.toObject ? r.toObject() : {
          type: r.type,
          atoms: r.atoms,
          size: r.size,
          ringNumber: r.ringNumber,
          offset: r.offset,
          substitutions: { ...r.substitutions },
          attachments: {},
        })),
      };
    },
    toCode(varName = 'fusedRing') {
      return decompile(this, { varName });
    },
  });
}

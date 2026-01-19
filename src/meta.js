/**
 * Metadata class for tracking ring information in fragments
 */
export class Meta {
  constructor(rings = [], usedRingNumbers = []) {
    this.rings = rings;
    this.usedRingNumbers = usedRingNumbers;
  }

  /**
   * Get the next available ring number that doesn't conflict
   * @param {number} currentRingNumber - The current ring number being used
   * @returns {number} Next available ring number
   */
  getNextAvailableRingNumber(currentRingNumber = 0) {
    return Math.max(...this.usedRingNumbers, currentRingNumber) + 1;
  }

  /**
   * Check if a ring number is already used
   * @param {number} ringNumber - Ring number to check
   * @returns {boolean} True if the ring number is used
   */
  isRingNumberUsed(ringNumber) {
    return this.usedRingNumbers.includes(ringNumber);
  }

  /**
   * Create a ring number mapping for an attachment to avoid conflicts
   * @param {Meta} attachmentMeta - Meta from the attachment fragment
   * @param {number} currentRingNumber - Current ring number being used
   * @returns {Map<number, number>} Map from old to new ring numbers
   */
  createRingNumberMapping(attachmentMeta, currentRingNumber) {
    const ringNumberMap = new Map();
    let nextAvailableRingNum = this.getNextAvailableRingNumber(currentRingNumber);

    attachmentMeta.usedRingNumbers.forEach((attachRingNum) => {
      if (this.isRingNumberUsed(attachRingNum) || attachRingNum === currentRingNumber) {
        ringNumberMap.set(attachRingNum, nextAvailableRingNum);
        nextAvailableRingNum += 1;
      }
    });

    return ringNumberMap;
  }
}

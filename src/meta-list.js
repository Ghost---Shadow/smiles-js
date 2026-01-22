import { Meta } from './meta.js';

/**
 * MetaList class - An array of Meta instances with a toObject method
 * that correctly converts all Meta instances to plain objects
 */
export class MetaList extends Array {
  /**
   * Create a MetaList from an array of Meta instances or plain objects
   * @param {Array<Meta|Object>} items - Array of Meta instances or plain objects
   * @returns {MetaList} New MetaList instance
   */
  static from(items) {
    const list = new MetaList();
    items.forEach((item) => {
      if (item instanceof Meta) {
        list.push(item);
      } else {
        list.push(new Meta(item));
      }
    });
    return list;
  }

  /**
   * Convert all Meta instances in the list to plain objects
   * @returns {Array<Object>} Array of plain objects
   */
  toObject() {
    return this.map((item) => {
      if (item instanceof Meta) {
        return item.toObject();
      }
      throw new Error('Not Meta');
    });
  }
}

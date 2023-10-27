import { bindings } from "../bindings/bindings-config";

export class BindingService {
  static _instance;

  binding;

  constructor() {
    if (
      BindingService._instance !== undefined &&
      BindingService._instance !== null
    ) {
      throw new Error(
        `${this.constructor.name} Singleton already has an instance. Do not instantiate, but use the defined one with get()`
      );
    }
  }

  static get() {
    if (BindingService._instance === undefined)
      BindingService._instance = new BindingService();
    return BindingService._instance;
  }

  setBindingByIndex(bindingIndex) {
    let b = bindings[parseInt(bindingIndex)];
    this.binding = new b();
  }
}

import { p5binding } from "../bindings/p5/p5binding";
import { BindingType } from "../models/classroom-model";

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

  setBindingByBindingType(bindingType) {
    if (bindingType === BindingType.P5) {
      this.binding = p5binding;
    } else if (bindingType === BindingType.HYDRA) {
      //Implement mapping here.
    }
  }
}

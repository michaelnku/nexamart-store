export class PlaceOrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlaceOrderError";
  }
}


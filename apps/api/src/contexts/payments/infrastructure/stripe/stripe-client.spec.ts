import { ServiceUnavailableException } from '@nestjs/common';
import { getStripe, stripeConfigurado, resetStripeClient } from './stripe-client';
import { StripePaymentIntentAdapter } from './stripe-payment-intent.adapter';

describe('cliente de Stripe perezoso', () => {
  const keyOriginal = process.env.STRIPE_SECRET_KEY;

  beforeEach(() => {
    resetStripeClient();
  });

  afterAll(() => {
    if (keyOriginal === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = keyOriginal;
    resetStripeClient();
  });

  // El caso que tumbaba la API entera: sin la key, `new Stripe(undefined)`
  // reventaba en el CONSTRUCTOR del adapter, así que Nest no podía levantar
  // PaymentsModule y se caían también login, catálogo y aprendizaje.
  it('permite construir el adapter aunque falte STRIPE_SECRET_KEY', () => {
    delete process.env.STRIPE_SECRET_KEY;
    expect(() => new StripePaymentIntentAdapter()).not.toThrow();
  });

  it('falla con un error claro recién al usarlo sin key', () => {
    delete process.env.STRIPE_SECRET_KEY;
    expect(() => getStripe()).toThrow(ServiceUnavailableException);
    expect(() => getStripe()).toThrow(/STRIPE_SECRET_KEY/);
  });

  it('devuelve un cliente cuando la key está configurada', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_falsa_para_tests';
    const stripe = getStripe();
    expect(stripe).toBeDefined();
    expect(stripe.paymentIntents).toBeDefined();
  });

  it('memoiza el cliente entre llamadas', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_falsa_para_tests';
    expect(getStripe()).toBe(getStripe());
  });

  it('stripeConfigurado refleja la presencia de la key', () => {
    delete process.env.STRIPE_SECRET_KEY;
    expect(stripeConfigurado()).toBe(false);
    process.env.STRIPE_SECRET_KEY = 'sk_test_falsa_para_tests';
    expect(stripeConfigurado()).toBe(true);
  });
});

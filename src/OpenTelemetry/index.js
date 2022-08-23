import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { useEffect } from 'react';
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

const OpenTelemetry = () => {
  useEffect(() => {
    const provider = new WebTracerProvider({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'browser',
      }),
    });

    provider.register({
      contextManager: new ZoneContextManager()
    });

    registerInstrumentations({
      instrumentations: [
        getWebAutoInstrumentations({
          // load custom configuration for xml-http-request instrumentation
          '@opentelemetry/instrumentation-xml-http-request': {
            propagateTraceHeaderCorsUrls: [
              /.+/g,
            ],
          },
          // load custom configuration for fetch instrumentation
          '@opentelemetry/instrumentation-fetch': {
            propagateTraceHeaderCorsUrls: [
              /.+/g,
            ],
          },
        }),
      ],
    });
  }, []);

  return null;
};

export default OpenTelemetry;
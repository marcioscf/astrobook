import path from 'node:path'

import type { IntegrationOptions } from '@astrobook/types'
import type { AstroIntegration } from 'astro'

import { getVirtualRoutes } from './virtual-module/virtual-routes'
import { createVirtualFilesPlugin } from './virtual-module/vite-plugin'

export function createAstrobookIntegration(
  options?: IntegrationOptions,
): AstroIntegration {
  return {
    name: 'astrobook/core',
    hooks: {
      'astro:config:setup': async ({
        updateConfig,
        injectRoute,
        command,
        config,
      }) => {
        if (command === 'build' && options?.onlyDev) {
          return
        }

        const rootDir = path.resolve(options?.directory || '.')
        const baseUrl = options?.docsUrl || config.base || ''

        const routes = await getVirtualRoutes(rootDir)

        updateConfig({
          vite: {
            plugins: [createVirtualFilesPlugin(rootDir, baseUrl, routes)],
          },
        })

        for (const route of routes.values()) {
          const entrypoint = path.normalize(
            path.relative('.', route.entrypoint),
          )
          injectRoute({
            pattern: route.pattern,
            entrypoint,
            prerender: true,
          })
        }
        injectRoute({
          pattern: `/${baseUrl}`,
          entrypoint: 'astrobook/pages/app.astro',
          prerender: true,
        })
      },
    },
  }
}

module.exports = ({ env }) => ({
  defaultConnection: 'default',
  connections: {
    default: {
      connector: 'bookshelf',
      settings: {
        client: 'postgres',
        host: env('DATABASE_HOST', 'ep-lively-morning-a9a2gjdn-pooler.gwc.azure.neon.tech'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'neondb'),
        username: env('DATABASE_USERNAME', 'neondb_owner'),
        password: env('DATABASE_PASSWORD', 'npg_VFu1TgYskE6O'),
        ssl: env.bool('DATABASE_SSL', true),
      },
      options: {}
    },
  },
});

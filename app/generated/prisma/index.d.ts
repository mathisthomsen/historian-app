
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model EmailConfirmation
 * 
 */
export type EmailConfirmation = $Result.DefaultSelection<Prisma.$EmailConfirmationPayload>
/**
 * Model PasswordReset
 * 
 */
export type PasswordReset = $Result.DefaultSelection<Prisma.$PasswordResetPayload>
/**
 * Model RefreshToken
 * 
 */
export type RefreshToken = $Result.DefaultSelection<Prisma.$RefreshTokenPayload>
/**
 * Model events
 * 
 */
export type events = $Result.DefaultSelection<Prisma.$eventsPayload>
/**
 * Model event_types
 * 
 */
export type event_types = $Result.DefaultSelection<Prisma.$event_typesPayload>
/**
 * Model life_events
 * 
 */
export type life_events = $Result.DefaultSelection<Prisma.$life_eventsPayload>
/**
 * Model persons
 * 
 */
export type persons = $Result.DefaultSelection<Prisma.$personsPayload>
/**
 * Model person_relations
 * 
 */
export type person_relations = $Result.DefaultSelection<Prisma.$person_relationsPayload>
/**
 * Model literature
 * 
 */
export type literature = $Result.DefaultSelection<Prisma.$literaturePayload>
/**
 * Model BibliographySync
 * 
 */
export type BibliographySync = $Result.DefaultSelection<Prisma.$BibliographySyncPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const UserRole: {
  USER: 'USER',
  ADMIN: 'ADMIN'
};

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

}

export type UserRole = $Enums.UserRole

export const UserRole: typeof $Enums.UserRole

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.emailConfirmation`: Exposes CRUD operations for the **EmailConfirmation** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more EmailConfirmations
    * const emailConfirmations = await prisma.emailConfirmation.findMany()
    * ```
    */
  get emailConfirmation(): Prisma.EmailConfirmationDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.passwordReset`: Exposes CRUD operations for the **PasswordReset** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PasswordResets
    * const passwordResets = await prisma.passwordReset.findMany()
    * ```
    */
  get passwordReset(): Prisma.PasswordResetDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.refreshToken`: Exposes CRUD operations for the **RefreshToken** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more RefreshTokens
    * const refreshTokens = await prisma.refreshToken.findMany()
    * ```
    */
  get refreshToken(): Prisma.RefreshTokenDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.events`: Exposes CRUD operations for the **events** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Events
    * const events = await prisma.events.findMany()
    * ```
    */
  get events(): Prisma.eventsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.event_types`: Exposes CRUD operations for the **event_types** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Event_types
    * const event_types = await prisma.event_types.findMany()
    * ```
    */
  get event_types(): Prisma.event_typesDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.life_events`: Exposes CRUD operations for the **life_events** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Life_events
    * const life_events = await prisma.life_events.findMany()
    * ```
    */
  get life_events(): Prisma.life_eventsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.persons`: Exposes CRUD operations for the **persons** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Persons
    * const persons = await prisma.persons.findMany()
    * ```
    */
  get persons(): Prisma.personsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.person_relations`: Exposes CRUD operations for the **person_relations** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Person_relations
    * const person_relations = await prisma.person_relations.findMany()
    * ```
    */
  get person_relations(): Prisma.person_relationsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.literature`: Exposes CRUD operations for the **literature** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Literature
    * const literature = await prisma.literature.findMany()
    * ```
    */
  get literature(): Prisma.literatureDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.bibliographySync`: Exposes CRUD operations for the **BibliographySync** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more BibliographySyncs
    * const bibliographySyncs = await prisma.bibliographySync.findMany()
    * ```
    */
  get bibliographySync(): Prisma.BibliographySyncDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.10.1
   * Query Engine version: 9b628578b3b7cae625e8c927178f15a170e74a9c
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    EmailConfirmation: 'EmailConfirmation',
    PasswordReset: 'PasswordReset',
    RefreshToken: 'RefreshToken',
    events: 'events',
    event_types: 'event_types',
    life_events: 'life_events',
    persons: 'persons',
    person_relations: 'person_relations',
    literature: 'literature',
    BibliographySync: 'BibliographySync'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "user" | "emailConfirmation" | "passwordReset" | "refreshToken" | "events" | "event_types" | "life_events" | "persons" | "person_relations" | "literature" | "bibliographySync"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      EmailConfirmation: {
        payload: Prisma.$EmailConfirmationPayload<ExtArgs>
        fields: Prisma.EmailConfirmationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.EmailConfirmationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailConfirmationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.EmailConfirmationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailConfirmationPayload>
          }
          findFirst: {
            args: Prisma.EmailConfirmationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailConfirmationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.EmailConfirmationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailConfirmationPayload>
          }
          findMany: {
            args: Prisma.EmailConfirmationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailConfirmationPayload>[]
          }
          create: {
            args: Prisma.EmailConfirmationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailConfirmationPayload>
          }
          createMany: {
            args: Prisma.EmailConfirmationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.EmailConfirmationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailConfirmationPayload>
          }
          update: {
            args: Prisma.EmailConfirmationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailConfirmationPayload>
          }
          deleteMany: {
            args: Prisma.EmailConfirmationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.EmailConfirmationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.EmailConfirmationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailConfirmationPayload>
          }
          aggregate: {
            args: Prisma.EmailConfirmationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEmailConfirmation>
          }
          groupBy: {
            args: Prisma.EmailConfirmationGroupByArgs<ExtArgs>
            result: $Utils.Optional<EmailConfirmationGroupByOutputType>[]
          }
          count: {
            args: Prisma.EmailConfirmationCountArgs<ExtArgs>
            result: $Utils.Optional<EmailConfirmationCountAggregateOutputType> | number
          }
        }
      }
      PasswordReset: {
        payload: Prisma.$PasswordResetPayload<ExtArgs>
        fields: Prisma.PasswordResetFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PasswordResetFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PasswordResetFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetPayload>
          }
          findFirst: {
            args: Prisma.PasswordResetFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PasswordResetFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetPayload>
          }
          findMany: {
            args: Prisma.PasswordResetFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetPayload>[]
          }
          create: {
            args: Prisma.PasswordResetCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetPayload>
          }
          createMany: {
            args: Prisma.PasswordResetCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.PasswordResetDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetPayload>
          }
          update: {
            args: Prisma.PasswordResetUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetPayload>
          }
          deleteMany: {
            args: Prisma.PasswordResetDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PasswordResetUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.PasswordResetUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetPayload>
          }
          aggregate: {
            args: Prisma.PasswordResetAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePasswordReset>
          }
          groupBy: {
            args: Prisma.PasswordResetGroupByArgs<ExtArgs>
            result: $Utils.Optional<PasswordResetGroupByOutputType>[]
          }
          count: {
            args: Prisma.PasswordResetCountArgs<ExtArgs>
            result: $Utils.Optional<PasswordResetCountAggregateOutputType> | number
          }
        }
      }
      RefreshToken: {
        payload: Prisma.$RefreshTokenPayload<ExtArgs>
        fields: Prisma.RefreshTokenFieldRefs
        operations: {
          findUnique: {
            args: Prisma.RefreshTokenFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RefreshTokenPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.RefreshTokenFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RefreshTokenPayload>
          }
          findFirst: {
            args: Prisma.RefreshTokenFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RefreshTokenPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.RefreshTokenFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RefreshTokenPayload>
          }
          findMany: {
            args: Prisma.RefreshTokenFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RefreshTokenPayload>[]
          }
          create: {
            args: Prisma.RefreshTokenCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RefreshTokenPayload>
          }
          createMany: {
            args: Prisma.RefreshTokenCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.RefreshTokenDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RefreshTokenPayload>
          }
          update: {
            args: Prisma.RefreshTokenUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RefreshTokenPayload>
          }
          deleteMany: {
            args: Prisma.RefreshTokenDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.RefreshTokenUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.RefreshTokenUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RefreshTokenPayload>
          }
          aggregate: {
            args: Prisma.RefreshTokenAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateRefreshToken>
          }
          groupBy: {
            args: Prisma.RefreshTokenGroupByArgs<ExtArgs>
            result: $Utils.Optional<RefreshTokenGroupByOutputType>[]
          }
          count: {
            args: Prisma.RefreshTokenCountArgs<ExtArgs>
            result: $Utils.Optional<RefreshTokenCountAggregateOutputType> | number
          }
        }
      }
      events: {
        payload: Prisma.$eventsPayload<ExtArgs>
        fields: Prisma.eventsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.eventsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$eventsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.eventsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$eventsPayload>
          }
          findFirst: {
            args: Prisma.eventsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$eventsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.eventsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$eventsPayload>
          }
          findMany: {
            args: Prisma.eventsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$eventsPayload>[]
          }
          create: {
            args: Prisma.eventsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$eventsPayload>
          }
          createMany: {
            args: Prisma.eventsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.eventsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$eventsPayload>
          }
          update: {
            args: Prisma.eventsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$eventsPayload>
          }
          deleteMany: {
            args: Prisma.eventsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.eventsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.eventsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$eventsPayload>
          }
          aggregate: {
            args: Prisma.EventsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEvents>
          }
          groupBy: {
            args: Prisma.eventsGroupByArgs<ExtArgs>
            result: $Utils.Optional<EventsGroupByOutputType>[]
          }
          count: {
            args: Prisma.eventsCountArgs<ExtArgs>
            result: $Utils.Optional<EventsCountAggregateOutputType> | number
          }
        }
      }
      event_types: {
        payload: Prisma.$event_typesPayload<ExtArgs>
        fields: Prisma.event_typesFieldRefs
        operations: {
          findUnique: {
            args: Prisma.event_typesFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$event_typesPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.event_typesFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$event_typesPayload>
          }
          findFirst: {
            args: Prisma.event_typesFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$event_typesPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.event_typesFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$event_typesPayload>
          }
          findMany: {
            args: Prisma.event_typesFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$event_typesPayload>[]
          }
          create: {
            args: Prisma.event_typesCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$event_typesPayload>
          }
          createMany: {
            args: Prisma.event_typesCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.event_typesDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$event_typesPayload>
          }
          update: {
            args: Prisma.event_typesUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$event_typesPayload>
          }
          deleteMany: {
            args: Prisma.event_typesDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.event_typesUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.event_typesUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$event_typesPayload>
          }
          aggregate: {
            args: Prisma.Event_typesAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEvent_types>
          }
          groupBy: {
            args: Prisma.event_typesGroupByArgs<ExtArgs>
            result: $Utils.Optional<Event_typesGroupByOutputType>[]
          }
          count: {
            args: Prisma.event_typesCountArgs<ExtArgs>
            result: $Utils.Optional<Event_typesCountAggregateOutputType> | number
          }
        }
      }
      life_events: {
        payload: Prisma.$life_eventsPayload<ExtArgs>
        fields: Prisma.life_eventsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.life_eventsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$life_eventsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.life_eventsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$life_eventsPayload>
          }
          findFirst: {
            args: Prisma.life_eventsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$life_eventsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.life_eventsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$life_eventsPayload>
          }
          findMany: {
            args: Prisma.life_eventsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$life_eventsPayload>[]
          }
          create: {
            args: Prisma.life_eventsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$life_eventsPayload>
          }
          createMany: {
            args: Prisma.life_eventsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.life_eventsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$life_eventsPayload>
          }
          update: {
            args: Prisma.life_eventsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$life_eventsPayload>
          }
          deleteMany: {
            args: Prisma.life_eventsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.life_eventsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.life_eventsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$life_eventsPayload>
          }
          aggregate: {
            args: Prisma.Life_eventsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLife_events>
          }
          groupBy: {
            args: Prisma.life_eventsGroupByArgs<ExtArgs>
            result: $Utils.Optional<Life_eventsGroupByOutputType>[]
          }
          count: {
            args: Prisma.life_eventsCountArgs<ExtArgs>
            result: $Utils.Optional<Life_eventsCountAggregateOutputType> | number
          }
        }
      }
      persons: {
        payload: Prisma.$personsPayload<ExtArgs>
        fields: Prisma.personsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.personsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$personsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.personsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$personsPayload>
          }
          findFirst: {
            args: Prisma.personsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$personsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.personsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$personsPayload>
          }
          findMany: {
            args: Prisma.personsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$personsPayload>[]
          }
          create: {
            args: Prisma.personsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$personsPayload>
          }
          createMany: {
            args: Prisma.personsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.personsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$personsPayload>
          }
          update: {
            args: Prisma.personsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$personsPayload>
          }
          deleteMany: {
            args: Prisma.personsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.personsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.personsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$personsPayload>
          }
          aggregate: {
            args: Prisma.PersonsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePersons>
          }
          groupBy: {
            args: Prisma.personsGroupByArgs<ExtArgs>
            result: $Utils.Optional<PersonsGroupByOutputType>[]
          }
          count: {
            args: Prisma.personsCountArgs<ExtArgs>
            result: $Utils.Optional<PersonsCountAggregateOutputType> | number
          }
        }
      }
      person_relations: {
        payload: Prisma.$person_relationsPayload<ExtArgs>
        fields: Prisma.person_relationsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.person_relationsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$person_relationsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.person_relationsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$person_relationsPayload>
          }
          findFirst: {
            args: Prisma.person_relationsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$person_relationsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.person_relationsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$person_relationsPayload>
          }
          findMany: {
            args: Prisma.person_relationsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$person_relationsPayload>[]
          }
          create: {
            args: Prisma.person_relationsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$person_relationsPayload>
          }
          createMany: {
            args: Prisma.person_relationsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.person_relationsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$person_relationsPayload>
          }
          update: {
            args: Prisma.person_relationsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$person_relationsPayload>
          }
          deleteMany: {
            args: Prisma.person_relationsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.person_relationsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.person_relationsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$person_relationsPayload>
          }
          aggregate: {
            args: Prisma.Person_relationsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePerson_relations>
          }
          groupBy: {
            args: Prisma.person_relationsGroupByArgs<ExtArgs>
            result: $Utils.Optional<Person_relationsGroupByOutputType>[]
          }
          count: {
            args: Prisma.person_relationsCountArgs<ExtArgs>
            result: $Utils.Optional<Person_relationsCountAggregateOutputType> | number
          }
        }
      }
      literature: {
        payload: Prisma.$literaturePayload<ExtArgs>
        fields: Prisma.literatureFieldRefs
        operations: {
          findUnique: {
            args: Prisma.literatureFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$literaturePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.literatureFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$literaturePayload>
          }
          findFirst: {
            args: Prisma.literatureFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$literaturePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.literatureFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$literaturePayload>
          }
          findMany: {
            args: Prisma.literatureFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$literaturePayload>[]
          }
          create: {
            args: Prisma.literatureCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$literaturePayload>
          }
          createMany: {
            args: Prisma.literatureCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.literatureDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$literaturePayload>
          }
          update: {
            args: Prisma.literatureUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$literaturePayload>
          }
          deleteMany: {
            args: Prisma.literatureDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.literatureUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.literatureUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$literaturePayload>
          }
          aggregate: {
            args: Prisma.LiteratureAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLiterature>
          }
          groupBy: {
            args: Prisma.literatureGroupByArgs<ExtArgs>
            result: $Utils.Optional<LiteratureGroupByOutputType>[]
          }
          count: {
            args: Prisma.literatureCountArgs<ExtArgs>
            result: $Utils.Optional<LiteratureCountAggregateOutputType> | number
          }
        }
      }
      BibliographySync: {
        payload: Prisma.$BibliographySyncPayload<ExtArgs>
        fields: Prisma.BibliographySyncFieldRefs
        operations: {
          findUnique: {
            args: Prisma.BibliographySyncFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BibliographySyncPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.BibliographySyncFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BibliographySyncPayload>
          }
          findFirst: {
            args: Prisma.BibliographySyncFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BibliographySyncPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.BibliographySyncFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BibliographySyncPayload>
          }
          findMany: {
            args: Prisma.BibliographySyncFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BibliographySyncPayload>[]
          }
          create: {
            args: Prisma.BibliographySyncCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BibliographySyncPayload>
          }
          createMany: {
            args: Prisma.BibliographySyncCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.BibliographySyncDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BibliographySyncPayload>
          }
          update: {
            args: Prisma.BibliographySyncUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BibliographySyncPayload>
          }
          deleteMany: {
            args: Prisma.BibliographySyncDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.BibliographySyncUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.BibliographySyncUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BibliographySyncPayload>
          }
          aggregate: {
            args: Prisma.BibliographySyncAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBibliographySync>
          }
          groupBy: {
            args: Prisma.BibliographySyncGroupByArgs<ExtArgs>
            result: $Utils.Optional<BibliographySyncGroupByOutputType>[]
          }
          count: {
            args: Prisma.BibliographySyncCountArgs<ExtArgs>
            result: $Utils.Optional<BibliographySyncCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    user?: UserOmit
    emailConfirmation?: EmailConfirmationOmit
    passwordReset?: PasswordResetOmit
    refreshToken?: RefreshTokenOmit
    events?: eventsOmit
    event_types?: event_typesOmit
    life_events?: life_eventsOmit
    persons?: personsOmit
    person_relations?: person_relationsOmit
    literature?: literatureOmit
    bibliographySync?: BibliographySyncOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    emailConfirmations: number
    passwordResets: number
    refreshTokens: number
    events: number
    persons: number
    life_events: number
    event_types: number
    literature: number
    bibliographySyncs: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    emailConfirmations?: boolean | UserCountOutputTypeCountEmailConfirmationsArgs
    passwordResets?: boolean | UserCountOutputTypeCountPasswordResetsArgs
    refreshTokens?: boolean | UserCountOutputTypeCountRefreshTokensArgs
    events?: boolean | UserCountOutputTypeCountEventsArgs
    persons?: boolean | UserCountOutputTypeCountPersonsArgs
    life_events?: boolean | UserCountOutputTypeCountLife_eventsArgs
    event_types?: boolean | UserCountOutputTypeCountEvent_typesArgs
    literature?: boolean | UserCountOutputTypeCountLiteratureArgs
    bibliographySyncs?: boolean | UserCountOutputTypeCountBibliographySyncsArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountEmailConfirmationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EmailConfirmationWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountPasswordResetsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PasswordResetWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountRefreshTokensArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RefreshTokenWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountEventsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: eventsWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountPersonsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: personsWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountLife_eventsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: life_eventsWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountEvent_typesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: event_typesWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountLiteratureArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: literatureWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountBibliographySyncsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BibliographySyncWhereInput
  }


  /**
   * Count Type EventsCountOutputType
   */

  export type EventsCountOutputType = {
    life_events: number
  }

  export type EventsCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    life_events?: boolean | EventsCountOutputTypeCountLife_eventsArgs
  }

  // Custom InputTypes
  /**
   * EventsCountOutputType without action
   */
  export type EventsCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventsCountOutputType
     */
    select?: EventsCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * EventsCountOutputType without action
   */
  export type EventsCountOutputTypeCountLife_eventsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: life_eventsWhereInput
  }


  /**
   * Count Type Event_typesCountOutputType
   */

  export type Event_typesCountOutputType = {
    life_events: number
  }

  export type Event_typesCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    life_events?: boolean | Event_typesCountOutputTypeCountLife_eventsArgs
  }

  // Custom InputTypes
  /**
   * Event_typesCountOutputType without action
   */
  export type Event_typesCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Event_typesCountOutputType
     */
    select?: Event_typesCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * Event_typesCountOutputType without action
   */
  export type Event_typesCountOutputTypeCountLife_eventsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: life_eventsWhereInput
  }


  /**
   * Count Type PersonsCountOutputType
   */

  export type PersonsCountOutputType = {
    life_events: number
    relations_from: number
    relations_to: number
  }

  export type PersonsCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    life_events?: boolean | PersonsCountOutputTypeCountLife_eventsArgs
    relations_from?: boolean | PersonsCountOutputTypeCountRelations_fromArgs
    relations_to?: boolean | PersonsCountOutputTypeCountRelations_toArgs
  }

  // Custom InputTypes
  /**
   * PersonsCountOutputType without action
   */
  export type PersonsCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PersonsCountOutputType
     */
    select?: PersonsCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * PersonsCountOutputType without action
   */
  export type PersonsCountOutputTypeCountLife_eventsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: life_eventsWhereInput
  }

  /**
   * PersonsCountOutputType without action
   */
  export type PersonsCountOutputTypeCountRelations_fromArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: person_relationsWhereInput
  }

  /**
   * PersonsCountOutputType without action
   */
  export type PersonsCountOutputTypeCountRelations_toArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: person_relationsWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserAvgAggregateOutputType = {
    id: number | null
  }

  export type UserSumAggregateOutputType = {
    id: number | null
  }

  export type UserMinAggregateOutputType = {
    id: number | null
    email: string | null
    name: string | null
    password: string | null
    role: $Enums.UserRole | null
    emailVerified: boolean | null
    emailVerifiedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
    lastLoginAt: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: number | null
    email: string | null
    name: string | null
    password: string | null
    role: $Enums.UserRole | null
    emailVerified: boolean | null
    emailVerifiedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
    lastLoginAt: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    email: number
    name: number
    password: number
    role: number
    emailVerified: number
    emailVerifiedAt: number
    createdAt: number
    updatedAt: number
    lastLoginAt: number
    _all: number
  }


  export type UserAvgAggregateInputType = {
    id?: true
  }

  export type UserSumAggregateInputType = {
    id?: true
  }

  export type UserMinAggregateInputType = {
    id?: true
    email?: true
    name?: true
    password?: true
    role?: true
    emailVerified?: true
    emailVerifiedAt?: true
    createdAt?: true
    updatedAt?: true
    lastLoginAt?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    email?: true
    name?: true
    password?: true
    role?: true
    emailVerified?: true
    emailVerifiedAt?: true
    createdAt?: true
    updatedAt?: true
    lastLoginAt?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    email?: true
    name?: true
    password?: true
    role?: true
    emailVerified?: true
    emailVerifiedAt?: true
    createdAt?: true
    updatedAt?: true
    lastLoginAt?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: UserAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UserSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _avg?: UserAvgAggregateInputType
    _sum?: UserSumAggregateInputType
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: number
    email: string
    name: string
    password: string
    role: $Enums.UserRole
    emailVerified: boolean
    emailVerifiedAt: Date | null
    createdAt: Date
    updatedAt: Date
    lastLoginAt: Date | null
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    name?: boolean
    password?: boolean
    role?: boolean
    emailVerified?: boolean
    emailVerifiedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    lastLoginAt?: boolean
    emailConfirmations?: boolean | User$emailConfirmationsArgs<ExtArgs>
    passwordResets?: boolean | User$passwordResetsArgs<ExtArgs>
    refreshTokens?: boolean | User$refreshTokensArgs<ExtArgs>
    events?: boolean | User$eventsArgs<ExtArgs>
    persons?: boolean | User$personsArgs<ExtArgs>
    life_events?: boolean | User$life_eventsArgs<ExtArgs>
    event_types?: boolean | User$event_typesArgs<ExtArgs>
    literature?: boolean | User$literatureArgs<ExtArgs>
    bibliographySyncs?: boolean | User$bibliographySyncsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>



  export type UserSelectScalar = {
    id?: boolean
    email?: boolean
    name?: boolean
    password?: boolean
    role?: boolean
    emailVerified?: boolean
    emailVerifiedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    lastLoginAt?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "email" | "name" | "password" | "role" | "emailVerified" | "emailVerifiedAt" | "createdAt" | "updatedAt" | "lastLoginAt", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    emailConfirmations?: boolean | User$emailConfirmationsArgs<ExtArgs>
    passwordResets?: boolean | User$passwordResetsArgs<ExtArgs>
    refreshTokens?: boolean | User$refreshTokensArgs<ExtArgs>
    events?: boolean | User$eventsArgs<ExtArgs>
    persons?: boolean | User$personsArgs<ExtArgs>
    life_events?: boolean | User$life_eventsArgs<ExtArgs>
    event_types?: boolean | User$event_typesArgs<ExtArgs>
    literature?: boolean | User$literatureArgs<ExtArgs>
    bibliographySyncs?: boolean | User$bibliographySyncsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      emailConfirmations: Prisma.$EmailConfirmationPayload<ExtArgs>[]
      passwordResets: Prisma.$PasswordResetPayload<ExtArgs>[]
      refreshTokens: Prisma.$RefreshTokenPayload<ExtArgs>[]
      events: Prisma.$eventsPayload<ExtArgs>[]
      persons: Prisma.$personsPayload<ExtArgs>[]
      life_events: Prisma.$life_eventsPayload<ExtArgs>[]
      event_types: Prisma.$event_typesPayload<ExtArgs>[]
      literature: Prisma.$literaturePayload<ExtArgs>[]
      bibliographySyncs: Prisma.$BibliographySyncPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      email: string
      name: string
      password: string
      role: $Enums.UserRole
      emailVerified: boolean
      emailVerifiedAt: Date | null
      createdAt: Date
      updatedAt: Date
      lastLoginAt: Date | null
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    emailConfirmations<T extends User$emailConfirmationsArgs<ExtArgs> = {}>(args?: Subset<T, User$emailConfirmationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EmailConfirmationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    passwordResets<T extends User$passwordResetsArgs<ExtArgs> = {}>(args?: Subset<T, User$passwordResetsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PasswordResetPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    refreshTokens<T extends User$refreshTokensArgs<ExtArgs> = {}>(args?: Subset<T, User$refreshTokensArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RefreshTokenPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    events<T extends User$eventsArgs<ExtArgs> = {}>(args?: Subset<T, User$eventsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$eventsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    persons<T extends User$personsArgs<ExtArgs> = {}>(args?: Subset<T, User$personsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$personsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    life_events<T extends User$life_eventsArgs<ExtArgs> = {}>(args?: Subset<T, User$life_eventsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$life_eventsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    event_types<T extends User$event_typesArgs<ExtArgs> = {}>(args?: Subset<T, User$event_typesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$event_typesPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    literature<T extends User$literatureArgs<ExtArgs> = {}>(args?: Subset<T, User$literatureArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$literaturePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    bibliographySyncs<T extends User$bibliographySyncsArgs<ExtArgs> = {}>(args?: Subset<T, User$bibliographySyncsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BibliographySyncPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'Int'>
    readonly email: FieldRef<"User", 'String'>
    readonly name: FieldRef<"User", 'String'>
    readonly password: FieldRef<"User", 'String'>
    readonly role: FieldRef<"User", 'UserRole'>
    readonly emailVerified: FieldRef<"User", 'Boolean'>
    readonly emailVerifiedAt: FieldRef<"User", 'DateTime'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
    readonly lastLoginAt: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.emailConfirmations
   */
  export type User$emailConfirmationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailConfirmation
     */
    select?: EmailConfirmationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailConfirmation
     */
    omit?: EmailConfirmationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmailConfirmationInclude<ExtArgs> | null
    where?: EmailConfirmationWhereInput
    orderBy?: EmailConfirmationOrderByWithRelationInput | EmailConfirmationOrderByWithRelationInput[]
    cursor?: EmailConfirmationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: EmailConfirmationScalarFieldEnum | EmailConfirmationScalarFieldEnum[]
  }

  /**
   * User.passwordResets
   */
  export type User$passwordResetsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordReset
     */
    select?: PasswordResetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordReset
     */
    omit?: PasswordResetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetInclude<ExtArgs> | null
    where?: PasswordResetWhereInput
    orderBy?: PasswordResetOrderByWithRelationInput | PasswordResetOrderByWithRelationInput[]
    cursor?: PasswordResetWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PasswordResetScalarFieldEnum | PasswordResetScalarFieldEnum[]
  }

  /**
   * User.refreshTokens
   */
  export type User$refreshTokensArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RefreshToken
     */
    select?: RefreshTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RefreshToken
     */
    omit?: RefreshTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefreshTokenInclude<ExtArgs> | null
    where?: RefreshTokenWhereInput
    orderBy?: RefreshTokenOrderByWithRelationInput | RefreshTokenOrderByWithRelationInput[]
    cursor?: RefreshTokenWhereUniqueInput
    take?: number
    skip?: number
    distinct?: RefreshTokenScalarFieldEnum | RefreshTokenScalarFieldEnum[]
  }

  /**
   * User.events
   */
  export type User$eventsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the events
     */
    select?: eventsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the events
     */
    omit?: eventsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: eventsInclude<ExtArgs> | null
    where?: eventsWhereInput
    orderBy?: eventsOrderByWithRelationInput | eventsOrderByWithRelationInput[]
    cursor?: eventsWhereUniqueInput
    take?: number
    skip?: number
    distinct?: EventsScalarFieldEnum | EventsScalarFieldEnum[]
  }

  /**
   * User.persons
   */
  export type User$personsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the persons
     */
    select?: personsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the persons
     */
    omit?: personsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: personsInclude<ExtArgs> | null
    where?: personsWhereInput
    orderBy?: personsOrderByWithRelationInput | personsOrderByWithRelationInput[]
    cursor?: personsWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PersonsScalarFieldEnum | PersonsScalarFieldEnum[]
  }

  /**
   * User.life_events
   */
  export type User$life_eventsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the life_events
     */
    select?: life_eventsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the life_events
     */
    omit?: life_eventsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: life_eventsInclude<ExtArgs> | null
    where?: life_eventsWhereInput
    orderBy?: life_eventsOrderByWithRelationInput | life_eventsOrderByWithRelationInput[]
    cursor?: life_eventsWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Life_eventsScalarFieldEnum | Life_eventsScalarFieldEnum[]
  }

  /**
   * User.event_types
   */
  export type User$event_typesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the event_types
     */
    select?: event_typesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the event_types
     */
    omit?: event_typesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: event_typesInclude<ExtArgs> | null
    where?: event_typesWhereInput
    orderBy?: event_typesOrderByWithRelationInput | event_typesOrderByWithRelationInput[]
    cursor?: event_typesWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Event_typesScalarFieldEnum | Event_typesScalarFieldEnum[]
  }

  /**
   * User.literature
   */
  export type User$literatureArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the literature
     */
    select?: literatureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the literature
     */
    omit?: literatureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: literatureInclude<ExtArgs> | null
    where?: literatureWhereInput
    orderBy?: literatureOrderByWithRelationInput | literatureOrderByWithRelationInput[]
    cursor?: literatureWhereUniqueInput
    take?: number
    skip?: number
    distinct?: LiteratureScalarFieldEnum | LiteratureScalarFieldEnum[]
  }

  /**
   * User.bibliographySyncs
   */
  export type User$bibliographySyncsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BibliographySync
     */
    select?: BibliographySyncSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BibliographySync
     */
    omit?: BibliographySyncOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BibliographySyncInclude<ExtArgs> | null
    where?: BibliographySyncWhereInput
    orderBy?: BibliographySyncOrderByWithRelationInput | BibliographySyncOrderByWithRelationInput[]
    cursor?: BibliographySyncWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BibliographySyncScalarFieldEnum | BibliographySyncScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model EmailConfirmation
   */

  export type AggregateEmailConfirmation = {
    _count: EmailConfirmationCountAggregateOutputType | null
    _avg: EmailConfirmationAvgAggregateOutputType | null
    _sum: EmailConfirmationSumAggregateOutputType | null
    _min: EmailConfirmationMinAggregateOutputType | null
    _max: EmailConfirmationMaxAggregateOutputType | null
  }

  export type EmailConfirmationAvgAggregateOutputType = {
    id: number | null
    userId: number | null
  }

  export type EmailConfirmationSumAggregateOutputType = {
    id: number | null
    userId: number | null
  }

  export type EmailConfirmationMinAggregateOutputType = {
    id: number | null
    userId: number | null
    token: string | null
    expiresAt: Date | null
    createdAt: Date | null
  }

  export type EmailConfirmationMaxAggregateOutputType = {
    id: number | null
    userId: number | null
    token: string | null
    expiresAt: Date | null
    createdAt: Date | null
  }

  export type EmailConfirmationCountAggregateOutputType = {
    id: number
    userId: number
    token: number
    expiresAt: number
    createdAt: number
    _all: number
  }


  export type EmailConfirmationAvgAggregateInputType = {
    id?: true
    userId?: true
  }

  export type EmailConfirmationSumAggregateInputType = {
    id?: true
    userId?: true
  }

  export type EmailConfirmationMinAggregateInputType = {
    id?: true
    userId?: true
    token?: true
    expiresAt?: true
    createdAt?: true
  }

  export type EmailConfirmationMaxAggregateInputType = {
    id?: true
    userId?: true
    token?: true
    expiresAt?: true
    createdAt?: true
  }

  export type EmailConfirmationCountAggregateInputType = {
    id?: true
    userId?: true
    token?: true
    expiresAt?: true
    createdAt?: true
    _all?: true
  }

  export type EmailConfirmationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EmailConfirmation to aggregate.
     */
    where?: EmailConfirmationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EmailConfirmations to fetch.
     */
    orderBy?: EmailConfirmationOrderByWithRelationInput | EmailConfirmationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: EmailConfirmationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EmailConfirmations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EmailConfirmations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned EmailConfirmations
    **/
    _count?: true | EmailConfirmationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: EmailConfirmationAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: EmailConfirmationSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: EmailConfirmationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: EmailConfirmationMaxAggregateInputType
  }

  export type GetEmailConfirmationAggregateType<T extends EmailConfirmationAggregateArgs> = {
        [P in keyof T & keyof AggregateEmailConfirmation]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEmailConfirmation[P]>
      : GetScalarType<T[P], AggregateEmailConfirmation[P]>
  }




  export type EmailConfirmationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EmailConfirmationWhereInput
    orderBy?: EmailConfirmationOrderByWithAggregationInput | EmailConfirmationOrderByWithAggregationInput[]
    by: EmailConfirmationScalarFieldEnum[] | EmailConfirmationScalarFieldEnum
    having?: EmailConfirmationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: EmailConfirmationCountAggregateInputType | true
    _avg?: EmailConfirmationAvgAggregateInputType
    _sum?: EmailConfirmationSumAggregateInputType
    _min?: EmailConfirmationMinAggregateInputType
    _max?: EmailConfirmationMaxAggregateInputType
  }

  export type EmailConfirmationGroupByOutputType = {
    id: number
    userId: number
    token: string
    expiresAt: Date
    createdAt: Date
    _count: EmailConfirmationCountAggregateOutputType | null
    _avg: EmailConfirmationAvgAggregateOutputType | null
    _sum: EmailConfirmationSumAggregateOutputType | null
    _min: EmailConfirmationMinAggregateOutputType | null
    _max: EmailConfirmationMaxAggregateOutputType | null
  }

  type GetEmailConfirmationGroupByPayload<T extends EmailConfirmationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EmailConfirmationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof EmailConfirmationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EmailConfirmationGroupByOutputType[P]>
            : GetScalarType<T[P], EmailConfirmationGroupByOutputType[P]>
        }
      >
    >


  export type EmailConfirmationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    token?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["emailConfirmation"]>



  export type EmailConfirmationSelectScalar = {
    id?: boolean
    userId?: boolean
    token?: boolean
    expiresAt?: boolean
    createdAt?: boolean
  }

  export type EmailConfirmationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "token" | "expiresAt" | "createdAt", ExtArgs["result"]["emailConfirmation"]>
  export type EmailConfirmationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $EmailConfirmationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "EmailConfirmation"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      userId: number
      token: string
      expiresAt: Date
      createdAt: Date
    }, ExtArgs["result"]["emailConfirmation"]>
    composites: {}
  }

  type EmailConfirmationGetPayload<S extends boolean | null | undefined | EmailConfirmationDefaultArgs> = $Result.GetResult<Prisma.$EmailConfirmationPayload, S>

  type EmailConfirmationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<EmailConfirmationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: EmailConfirmationCountAggregateInputType | true
    }

  export interface EmailConfirmationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['EmailConfirmation'], meta: { name: 'EmailConfirmation' } }
    /**
     * Find zero or one EmailConfirmation that matches the filter.
     * @param {EmailConfirmationFindUniqueArgs} args - Arguments to find a EmailConfirmation
     * @example
     * // Get one EmailConfirmation
     * const emailConfirmation = await prisma.emailConfirmation.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EmailConfirmationFindUniqueArgs>(args: SelectSubset<T, EmailConfirmationFindUniqueArgs<ExtArgs>>): Prisma__EmailConfirmationClient<$Result.GetResult<Prisma.$EmailConfirmationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one EmailConfirmation that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {EmailConfirmationFindUniqueOrThrowArgs} args - Arguments to find a EmailConfirmation
     * @example
     * // Get one EmailConfirmation
     * const emailConfirmation = await prisma.emailConfirmation.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EmailConfirmationFindUniqueOrThrowArgs>(args: SelectSubset<T, EmailConfirmationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__EmailConfirmationClient<$Result.GetResult<Prisma.$EmailConfirmationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first EmailConfirmation that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailConfirmationFindFirstArgs} args - Arguments to find a EmailConfirmation
     * @example
     * // Get one EmailConfirmation
     * const emailConfirmation = await prisma.emailConfirmation.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EmailConfirmationFindFirstArgs>(args?: SelectSubset<T, EmailConfirmationFindFirstArgs<ExtArgs>>): Prisma__EmailConfirmationClient<$Result.GetResult<Prisma.$EmailConfirmationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first EmailConfirmation that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailConfirmationFindFirstOrThrowArgs} args - Arguments to find a EmailConfirmation
     * @example
     * // Get one EmailConfirmation
     * const emailConfirmation = await prisma.emailConfirmation.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EmailConfirmationFindFirstOrThrowArgs>(args?: SelectSubset<T, EmailConfirmationFindFirstOrThrowArgs<ExtArgs>>): Prisma__EmailConfirmationClient<$Result.GetResult<Prisma.$EmailConfirmationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more EmailConfirmations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailConfirmationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all EmailConfirmations
     * const emailConfirmations = await prisma.emailConfirmation.findMany()
     * 
     * // Get first 10 EmailConfirmations
     * const emailConfirmations = await prisma.emailConfirmation.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const emailConfirmationWithIdOnly = await prisma.emailConfirmation.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends EmailConfirmationFindManyArgs>(args?: SelectSubset<T, EmailConfirmationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EmailConfirmationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a EmailConfirmation.
     * @param {EmailConfirmationCreateArgs} args - Arguments to create a EmailConfirmation.
     * @example
     * // Create one EmailConfirmation
     * const EmailConfirmation = await prisma.emailConfirmation.create({
     *   data: {
     *     // ... data to create a EmailConfirmation
     *   }
     * })
     * 
     */
    create<T extends EmailConfirmationCreateArgs>(args: SelectSubset<T, EmailConfirmationCreateArgs<ExtArgs>>): Prisma__EmailConfirmationClient<$Result.GetResult<Prisma.$EmailConfirmationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many EmailConfirmations.
     * @param {EmailConfirmationCreateManyArgs} args - Arguments to create many EmailConfirmations.
     * @example
     * // Create many EmailConfirmations
     * const emailConfirmation = await prisma.emailConfirmation.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends EmailConfirmationCreateManyArgs>(args?: SelectSubset<T, EmailConfirmationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a EmailConfirmation.
     * @param {EmailConfirmationDeleteArgs} args - Arguments to delete one EmailConfirmation.
     * @example
     * // Delete one EmailConfirmation
     * const EmailConfirmation = await prisma.emailConfirmation.delete({
     *   where: {
     *     // ... filter to delete one EmailConfirmation
     *   }
     * })
     * 
     */
    delete<T extends EmailConfirmationDeleteArgs>(args: SelectSubset<T, EmailConfirmationDeleteArgs<ExtArgs>>): Prisma__EmailConfirmationClient<$Result.GetResult<Prisma.$EmailConfirmationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one EmailConfirmation.
     * @param {EmailConfirmationUpdateArgs} args - Arguments to update one EmailConfirmation.
     * @example
     * // Update one EmailConfirmation
     * const emailConfirmation = await prisma.emailConfirmation.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends EmailConfirmationUpdateArgs>(args: SelectSubset<T, EmailConfirmationUpdateArgs<ExtArgs>>): Prisma__EmailConfirmationClient<$Result.GetResult<Prisma.$EmailConfirmationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more EmailConfirmations.
     * @param {EmailConfirmationDeleteManyArgs} args - Arguments to filter EmailConfirmations to delete.
     * @example
     * // Delete a few EmailConfirmations
     * const { count } = await prisma.emailConfirmation.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends EmailConfirmationDeleteManyArgs>(args?: SelectSubset<T, EmailConfirmationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more EmailConfirmations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailConfirmationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many EmailConfirmations
     * const emailConfirmation = await prisma.emailConfirmation.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends EmailConfirmationUpdateManyArgs>(args: SelectSubset<T, EmailConfirmationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one EmailConfirmation.
     * @param {EmailConfirmationUpsertArgs} args - Arguments to update or create a EmailConfirmation.
     * @example
     * // Update or create a EmailConfirmation
     * const emailConfirmation = await prisma.emailConfirmation.upsert({
     *   create: {
     *     // ... data to create a EmailConfirmation
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the EmailConfirmation we want to update
     *   }
     * })
     */
    upsert<T extends EmailConfirmationUpsertArgs>(args: SelectSubset<T, EmailConfirmationUpsertArgs<ExtArgs>>): Prisma__EmailConfirmationClient<$Result.GetResult<Prisma.$EmailConfirmationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of EmailConfirmations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailConfirmationCountArgs} args - Arguments to filter EmailConfirmations to count.
     * @example
     * // Count the number of EmailConfirmations
     * const count = await prisma.emailConfirmation.count({
     *   where: {
     *     // ... the filter for the EmailConfirmations we want to count
     *   }
     * })
    **/
    count<T extends EmailConfirmationCountArgs>(
      args?: Subset<T, EmailConfirmationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], EmailConfirmationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a EmailConfirmation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailConfirmationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends EmailConfirmationAggregateArgs>(args: Subset<T, EmailConfirmationAggregateArgs>): Prisma.PrismaPromise<GetEmailConfirmationAggregateType<T>>

    /**
     * Group by EmailConfirmation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailConfirmationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends EmailConfirmationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EmailConfirmationGroupByArgs['orderBy'] }
        : { orderBy?: EmailConfirmationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, EmailConfirmationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEmailConfirmationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the EmailConfirmation model
   */
  readonly fields: EmailConfirmationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for EmailConfirmation.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EmailConfirmationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the EmailConfirmation model
   */
  interface EmailConfirmationFieldRefs {
    readonly id: FieldRef<"EmailConfirmation", 'Int'>
    readonly userId: FieldRef<"EmailConfirmation", 'Int'>
    readonly token: FieldRef<"EmailConfirmation", 'String'>
    readonly expiresAt: FieldRef<"EmailConfirmation", 'DateTime'>
    readonly createdAt: FieldRef<"EmailConfirmation", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * EmailConfirmation findUnique
   */
  export type EmailConfirmationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailConfirmation
     */
    select?: EmailConfirmationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailConfirmation
     */
    omit?: EmailConfirmationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmailConfirmationInclude<ExtArgs> | null
    /**
     * Filter, which EmailConfirmation to fetch.
     */
    where: EmailConfirmationWhereUniqueInput
  }

  /**
   * EmailConfirmation findUniqueOrThrow
   */
  export type EmailConfirmationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailConfirmation
     */
    select?: EmailConfirmationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailConfirmation
     */
    omit?: EmailConfirmationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmailConfirmationInclude<ExtArgs> | null
    /**
     * Filter, which EmailConfirmation to fetch.
     */
    where: EmailConfirmationWhereUniqueInput
  }

  /**
   * EmailConfirmation findFirst
   */
  export type EmailConfirmationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailConfirmation
     */
    select?: EmailConfirmationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailConfirmation
     */
    omit?: EmailConfirmationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmailConfirmationInclude<ExtArgs> | null
    /**
     * Filter, which EmailConfirmation to fetch.
     */
    where?: EmailConfirmationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EmailConfirmations to fetch.
     */
    orderBy?: EmailConfirmationOrderByWithRelationInput | EmailConfirmationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EmailConfirmations.
     */
    cursor?: EmailConfirmationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EmailConfirmations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EmailConfirmations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EmailConfirmations.
     */
    distinct?: EmailConfirmationScalarFieldEnum | EmailConfirmationScalarFieldEnum[]
  }

  /**
   * EmailConfirmation findFirstOrThrow
   */
  export type EmailConfirmationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailConfirmation
     */
    select?: EmailConfirmationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailConfirmation
     */
    omit?: EmailConfirmationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmailConfirmationInclude<ExtArgs> | null
    /**
     * Filter, which EmailConfirmation to fetch.
     */
    where?: EmailConfirmationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EmailConfirmations to fetch.
     */
    orderBy?: EmailConfirmationOrderByWithRelationInput | EmailConfirmationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EmailConfirmations.
     */
    cursor?: EmailConfirmationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EmailConfirmations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EmailConfirmations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EmailConfirmations.
     */
    distinct?: EmailConfirmationScalarFieldEnum | EmailConfirmationScalarFieldEnum[]
  }

  /**
   * EmailConfirmation findMany
   */
  export type EmailConfirmationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailConfirmation
     */
    select?: EmailConfirmationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailConfirmation
     */
    omit?: EmailConfirmationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmailConfirmationInclude<ExtArgs> | null
    /**
     * Filter, which EmailConfirmations to fetch.
     */
    where?: EmailConfirmationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EmailConfirmations to fetch.
     */
    orderBy?: EmailConfirmationOrderByWithRelationInput | EmailConfirmationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing EmailConfirmations.
     */
    cursor?: EmailConfirmationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EmailConfirmations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EmailConfirmations.
     */
    skip?: number
    distinct?: EmailConfirmationScalarFieldEnum | EmailConfirmationScalarFieldEnum[]
  }

  /**
   * EmailConfirmation create
   */
  export type EmailConfirmationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailConfirmation
     */
    select?: EmailConfirmationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailConfirmation
     */
    omit?: EmailConfirmationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmailConfirmationInclude<ExtArgs> | null
    /**
     * The data needed to create a EmailConfirmation.
     */
    data: XOR<EmailConfirmationCreateInput, EmailConfirmationUncheckedCreateInput>
  }

  /**
   * EmailConfirmation createMany
   */
  export type EmailConfirmationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many EmailConfirmations.
     */
    data: EmailConfirmationCreateManyInput | EmailConfirmationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * EmailConfirmation update
   */
  export type EmailConfirmationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailConfirmation
     */
    select?: EmailConfirmationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailConfirmation
     */
    omit?: EmailConfirmationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmailConfirmationInclude<ExtArgs> | null
    /**
     * The data needed to update a EmailConfirmation.
     */
    data: XOR<EmailConfirmationUpdateInput, EmailConfirmationUncheckedUpdateInput>
    /**
     * Choose, which EmailConfirmation to update.
     */
    where: EmailConfirmationWhereUniqueInput
  }

  /**
   * EmailConfirmation updateMany
   */
  export type EmailConfirmationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update EmailConfirmations.
     */
    data: XOR<EmailConfirmationUpdateManyMutationInput, EmailConfirmationUncheckedUpdateManyInput>
    /**
     * Filter which EmailConfirmations to update
     */
    where?: EmailConfirmationWhereInput
    /**
     * Limit how many EmailConfirmations to update.
     */
    limit?: number
  }

  /**
   * EmailConfirmation upsert
   */
  export type EmailConfirmationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailConfirmation
     */
    select?: EmailConfirmationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailConfirmation
     */
    omit?: EmailConfirmationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmailConfirmationInclude<ExtArgs> | null
    /**
     * The filter to search for the EmailConfirmation to update in case it exists.
     */
    where: EmailConfirmationWhereUniqueInput
    /**
     * In case the EmailConfirmation found by the `where` argument doesn't exist, create a new EmailConfirmation with this data.
     */
    create: XOR<EmailConfirmationCreateInput, EmailConfirmationUncheckedCreateInput>
    /**
     * In case the EmailConfirmation was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EmailConfirmationUpdateInput, EmailConfirmationUncheckedUpdateInput>
  }

  /**
   * EmailConfirmation delete
   */
  export type EmailConfirmationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailConfirmation
     */
    select?: EmailConfirmationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailConfirmation
     */
    omit?: EmailConfirmationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmailConfirmationInclude<ExtArgs> | null
    /**
     * Filter which EmailConfirmation to delete.
     */
    where: EmailConfirmationWhereUniqueInput
  }

  /**
   * EmailConfirmation deleteMany
   */
  export type EmailConfirmationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EmailConfirmations to delete
     */
    where?: EmailConfirmationWhereInput
    /**
     * Limit how many EmailConfirmations to delete.
     */
    limit?: number
  }

  /**
   * EmailConfirmation without action
   */
  export type EmailConfirmationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailConfirmation
     */
    select?: EmailConfirmationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailConfirmation
     */
    omit?: EmailConfirmationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EmailConfirmationInclude<ExtArgs> | null
  }


  /**
   * Model PasswordReset
   */

  export type AggregatePasswordReset = {
    _count: PasswordResetCountAggregateOutputType | null
    _avg: PasswordResetAvgAggregateOutputType | null
    _sum: PasswordResetSumAggregateOutputType | null
    _min: PasswordResetMinAggregateOutputType | null
    _max: PasswordResetMaxAggregateOutputType | null
  }

  export type PasswordResetAvgAggregateOutputType = {
    id: number | null
    userId: number | null
  }

  export type PasswordResetSumAggregateOutputType = {
    id: number | null
    userId: number | null
  }

  export type PasswordResetMinAggregateOutputType = {
    id: number | null
    userId: number | null
    token: string | null
    expiresAt: Date | null
    used: boolean | null
    createdAt: Date | null
  }

  export type PasswordResetMaxAggregateOutputType = {
    id: number | null
    userId: number | null
    token: string | null
    expiresAt: Date | null
    used: boolean | null
    createdAt: Date | null
  }

  export type PasswordResetCountAggregateOutputType = {
    id: number
    userId: number
    token: number
    expiresAt: number
    used: number
    createdAt: number
    _all: number
  }


  export type PasswordResetAvgAggregateInputType = {
    id?: true
    userId?: true
  }

  export type PasswordResetSumAggregateInputType = {
    id?: true
    userId?: true
  }

  export type PasswordResetMinAggregateInputType = {
    id?: true
    userId?: true
    token?: true
    expiresAt?: true
    used?: true
    createdAt?: true
  }

  export type PasswordResetMaxAggregateInputType = {
    id?: true
    userId?: true
    token?: true
    expiresAt?: true
    used?: true
    createdAt?: true
  }

  export type PasswordResetCountAggregateInputType = {
    id?: true
    userId?: true
    token?: true
    expiresAt?: true
    used?: true
    createdAt?: true
    _all?: true
  }

  export type PasswordResetAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PasswordReset to aggregate.
     */
    where?: PasswordResetWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PasswordResets to fetch.
     */
    orderBy?: PasswordResetOrderByWithRelationInput | PasswordResetOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PasswordResetWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PasswordResets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PasswordResets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PasswordResets
    **/
    _count?: true | PasswordResetCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PasswordResetAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PasswordResetSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PasswordResetMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PasswordResetMaxAggregateInputType
  }

  export type GetPasswordResetAggregateType<T extends PasswordResetAggregateArgs> = {
        [P in keyof T & keyof AggregatePasswordReset]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePasswordReset[P]>
      : GetScalarType<T[P], AggregatePasswordReset[P]>
  }




  export type PasswordResetGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PasswordResetWhereInput
    orderBy?: PasswordResetOrderByWithAggregationInput | PasswordResetOrderByWithAggregationInput[]
    by: PasswordResetScalarFieldEnum[] | PasswordResetScalarFieldEnum
    having?: PasswordResetScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PasswordResetCountAggregateInputType | true
    _avg?: PasswordResetAvgAggregateInputType
    _sum?: PasswordResetSumAggregateInputType
    _min?: PasswordResetMinAggregateInputType
    _max?: PasswordResetMaxAggregateInputType
  }

  export type PasswordResetGroupByOutputType = {
    id: number
    userId: number
    token: string
    expiresAt: Date
    used: boolean
    createdAt: Date
    _count: PasswordResetCountAggregateOutputType | null
    _avg: PasswordResetAvgAggregateOutputType | null
    _sum: PasswordResetSumAggregateOutputType | null
    _min: PasswordResetMinAggregateOutputType | null
    _max: PasswordResetMaxAggregateOutputType | null
  }

  type GetPasswordResetGroupByPayload<T extends PasswordResetGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PasswordResetGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PasswordResetGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PasswordResetGroupByOutputType[P]>
            : GetScalarType<T[P], PasswordResetGroupByOutputType[P]>
        }
      >
    >


  export type PasswordResetSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    token?: boolean
    expiresAt?: boolean
    used?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["passwordReset"]>



  export type PasswordResetSelectScalar = {
    id?: boolean
    userId?: boolean
    token?: boolean
    expiresAt?: boolean
    used?: boolean
    createdAt?: boolean
  }

  export type PasswordResetOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "token" | "expiresAt" | "used" | "createdAt", ExtArgs["result"]["passwordReset"]>
  export type PasswordResetInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $PasswordResetPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PasswordReset"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      userId: number
      token: string
      expiresAt: Date
      used: boolean
      createdAt: Date
    }, ExtArgs["result"]["passwordReset"]>
    composites: {}
  }

  type PasswordResetGetPayload<S extends boolean | null | undefined | PasswordResetDefaultArgs> = $Result.GetResult<Prisma.$PasswordResetPayload, S>

  type PasswordResetCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PasswordResetFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PasswordResetCountAggregateInputType | true
    }

  export interface PasswordResetDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PasswordReset'], meta: { name: 'PasswordReset' } }
    /**
     * Find zero or one PasswordReset that matches the filter.
     * @param {PasswordResetFindUniqueArgs} args - Arguments to find a PasswordReset
     * @example
     * // Get one PasswordReset
     * const passwordReset = await prisma.passwordReset.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PasswordResetFindUniqueArgs>(args: SelectSubset<T, PasswordResetFindUniqueArgs<ExtArgs>>): Prisma__PasswordResetClient<$Result.GetResult<Prisma.$PasswordResetPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one PasswordReset that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PasswordResetFindUniqueOrThrowArgs} args - Arguments to find a PasswordReset
     * @example
     * // Get one PasswordReset
     * const passwordReset = await prisma.passwordReset.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PasswordResetFindUniqueOrThrowArgs>(args: SelectSubset<T, PasswordResetFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PasswordResetClient<$Result.GetResult<Prisma.$PasswordResetPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PasswordReset that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PasswordResetFindFirstArgs} args - Arguments to find a PasswordReset
     * @example
     * // Get one PasswordReset
     * const passwordReset = await prisma.passwordReset.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PasswordResetFindFirstArgs>(args?: SelectSubset<T, PasswordResetFindFirstArgs<ExtArgs>>): Prisma__PasswordResetClient<$Result.GetResult<Prisma.$PasswordResetPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PasswordReset that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PasswordResetFindFirstOrThrowArgs} args - Arguments to find a PasswordReset
     * @example
     * // Get one PasswordReset
     * const passwordReset = await prisma.passwordReset.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PasswordResetFindFirstOrThrowArgs>(args?: SelectSubset<T, PasswordResetFindFirstOrThrowArgs<ExtArgs>>): Prisma__PasswordResetClient<$Result.GetResult<Prisma.$PasswordResetPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more PasswordResets that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PasswordResetFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PasswordResets
     * const passwordResets = await prisma.passwordReset.findMany()
     * 
     * // Get first 10 PasswordResets
     * const passwordResets = await prisma.passwordReset.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const passwordResetWithIdOnly = await prisma.passwordReset.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PasswordResetFindManyArgs>(args?: SelectSubset<T, PasswordResetFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PasswordResetPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a PasswordReset.
     * @param {PasswordResetCreateArgs} args - Arguments to create a PasswordReset.
     * @example
     * // Create one PasswordReset
     * const PasswordReset = await prisma.passwordReset.create({
     *   data: {
     *     // ... data to create a PasswordReset
     *   }
     * })
     * 
     */
    create<T extends PasswordResetCreateArgs>(args: SelectSubset<T, PasswordResetCreateArgs<ExtArgs>>): Prisma__PasswordResetClient<$Result.GetResult<Prisma.$PasswordResetPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many PasswordResets.
     * @param {PasswordResetCreateManyArgs} args - Arguments to create many PasswordResets.
     * @example
     * // Create many PasswordResets
     * const passwordReset = await prisma.passwordReset.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PasswordResetCreateManyArgs>(args?: SelectSubset<T, PasswordResetCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a PasswordReset.
     * @param {PasswordResetDeleteArgs} args - Arguments to delete one PasswordReset.
     * @example
     * // Delete one PasswordReset
     * const PasswordReset = await prisma.passwordReset.delete({
     *   where: {
     *     // ... filter to delete one PasswordReset
     *   }
     * })
     * 
     */
    delete<T extends PasswordResetDeleteArgs>(args: SelectSubset<T, PasswordResetDeleteArgs<ExtArgs>>): Prisma__PasswordResetClient<$Result.GetResult<Prisma.$PasswordResetPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one PasswordReset.
     * @param {PasswordResetUpdateArgs} args - Arguments to update one PasswordReset.
     * @example
     * // Update one PasswordReset
     * const passwordReset = await prisma.passwordReset.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PasswordResetUpdateArgs>(args: SelectSubset<T, PasswordResetUpdateArgs<ExtArgs>>): Prisma__PasswordResetClient<$Result.GetResult<Prisma.$PasswordResetPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more PasswordResets.
     * @param {PasswordResetDeleteManyArgs} args - Arguments to filter PasswordResets to delete.
     * @example
     * // Delete a few PasswordResets
     * const { count } = await prisma.passwordReset.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PasswordResetDeleteManyArgs>(args?: SelectSubset<T, PasswordResetDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PasswordResets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PasswordResetUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PasswordResets
     * const passwordReset = await prisma.passwordReset.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PasswordResetUpdateManyArgs>(args: SelectSubset<T, PasswordResetUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one PasswordReset.
     * @param {PasswordResetUpsertArgs} args - Arguments to update or create a PasswordReset.
     * @example
     * // Update or create a PasswordReset
     * const passwordReset = await prisma.passwordReset.upsert({
     *   create: {
     *     // ... data to create a PasswordReset
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PasswordReset we want to update
     *   }
     * })
     */
    upsert<T extends PasswordResetUpsertArgs>(args: SelectSubset<T, PasswordResetUpsertArgs<ExtArgs>>): Prisma__PasswordResetClient<$Result.GetResult<Prisma.$PasswordResetPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of PasswordResets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PasswordResetCountArgs} args - Arguments to filter PasswordResets to count.
     * @example
     * // Count the number of PasswordResets
     * const count = await prisma.passwordReset.count({
     *   where: {
     *     // ... the filter for the PasswordResets we want to count
     *   }
     * })
    **/
    count<T extends PasswordResetCountArgs>(
      args?: Subset<T, PasswordResetCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PasswordResetCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PasswordReset.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PasswordResetAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PasswordResetAggregateArgs>(args: Subset<T, PasswordResetAggregateArgs>): Prisma.PrismaPromise<GetPasswordResetAggregateType<T>>

    /**
     * Group by PasswordReset.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PasswordResetGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PasswordResetGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PasswordResetGroupByArgs['orderBy'] }
        : { orderBy?: PasswordResetGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PasswordResetGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPasswordResetGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PasswordReset model
   */
  readonly fields: PasswordResetFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PasswordReset.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PasswordResetClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PasswordReset model
   */
  interface PasswordResetFieldRefs {
    readonly id: FieldRef<"PasswordReset", 'Int'>
    readonly userId: FieldRef<"PasswordReset", 'Int'>
    readonly token: FieldRef<"PasswordReset", 'String'>
    readonly expiresAt: FieldRef<"PasswordReset", 'DateTime'>
    readonly used: FieldRef<"PasswordReset", 'Boolean'>
    readonly createdAt: FieldRef<"PasswordReset", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PasswordReset findUnique
   */
  export type PasswordResetFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordReset
     */
    select?: PasswordResetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordReset
     */
    omit?: PasswordResetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetInclude<ExtArgs> | null
    /**
     * Filter, which PasswordReset to fetch.
     */
    where: PasswordResetWhereUniqueInput
  }

  /**
   * PasswordReset findUniqueOrThrow
   */
  export type PasswordResetFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordReset
     */
    select?: PasswordResetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordReset
     */
    omit?: PasswordResetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetInclude<ExtArgs> | null
    /**
     * Filter, which PasswordReset to fetch.
     */
    where: PasswordResetWhereUniqueInput
  }

  /**
   * PasswordReset findFirst
   */
  export type PasswordResetFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordReset
     */
    select?: PasswordResetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordReset
     */
    omit?: PasswordResetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetInclude<ExtArgs> | null
    /**
     * Filter, which PasswordReset to fetch.
     */
    where?: PasswordResetWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PasswordResets to fetch.
     */
    orderBy?: PasswordResetOrderByWithRelationInput | PasswordResetOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PasswordResets.
     */
    cursor?: PasswordResetWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PasswordResets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PasswordResets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PasswordResets.
     */
    distinct?: PasswordResetScalarFieldEnum | PasswordResetScalarFieldEnum[]
  }

  /**
   * PasswordReset findFirstOrThrow
   */
  export type PasswordResetFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordReset
     */
    select?: PasswordResetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordReset
     */
    omit?: PasswordResetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetInclude<ExtArgs> | null
    /**
     * Filter, which PasswordReset to fetch.
     */
    where?: PasswordResetWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PasswordResets to fetch.
     */
    orderBy?: PasswordResetOrderByWithRelationInput | PasswordResetOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PasswordResets.
     */
    cursor?: PasswordResetWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PasswordResets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PasswordResets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PasswordResets.
     */
    distinct?: PasswordResetScalarFieldEnum | PasswordResetScalarFieldEnum[]
  }

  /**
   * PasswordReset findMany
   */
  export type PasswordResetFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordReset
     */
    select?: PasswordResetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordReset
     */
    omit?: PasswordResetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetInclude<ExtArgs> | null
    /**
     * Filter, which PasswordResets to fetch.
     */
    where?: PasswordResetWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PasswordResets to fetch.
     */
    orderBy?: PasswordResetOrderByWithRelationInput | PasswordResetOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PasswordResets.
     */
    cursor?: PasswordResetWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PasswordResets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PasswordResets.
     */
    skip?: number
    distinct?: PasswordResetScalarFieldEnum | PasswordResetScalarFieldEnum[]
  }

  /**
   * PasswordReset create
   */
  export type PasswordResetCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordReset
     */
    select?: PasswordResetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordReset
     */
    omit?: PasswordResetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetInclude<ExtArgs> | null
    /**
     * The data needed to create a PasswordReset.
     */
    data: XOR<PasswordResetCreateInput, PasswordResetUncheckedCreateInput>
  }

  /**
   * PasswordReset createMany
   */
  export type PasswordResetCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PasswordResets.
     */
    data: PasswordResetCreateManyInput | PasswordResetCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PasswordReset update
   */
  export type PasswordResetUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordReset
     */
    select?: PasswordResetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordReset
     */
    omit?: PasswordResetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetInclude<ExtArgs> | null
    /**
     * The data needed to update a PasswordReset.
     */
    data: XOR<PasswordResetUpdateInput, PasswordResetUncheckedUpdateInput>
    /**
     * Choose, which PasswordReset to update.
     */
    where: PasswordResetWhereUniqueInput
  }

  /**
   * PasswordReset updateMany
   */
  export type PasswordResetUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PasswordResets.
     */
    data: XOR<PasswordResetUpdateManyMutationInput, PasswordResetUncheckedUpdateManyInput>
    /**
     * Filter which PasswordResets to update
     */
    where?: PasswordResetWhereInput
    /**
     * Limit how many PasswordResets to update.
     */
    limit?: number
  }

  /**
   * PasswordReset upsert
   */
  export type PasswordResetUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordReset
     */
    select?: PasswordResetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordReset
     */
    omit?: PasswordResetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetInclude<ExtArgs> | null
    /**
     * The filter to search for the PasswordReset to update in case it exists.
     */
    where: PasswordResetWhereUniqueInput
    /**
     * In case the PasswordReset found by the `where` argument doesn't exist, create a new PasswordReset with this data.
     */
    create: XOR<PasswordResetCreateInput, PasswordResetUncheckedCreateInput>
    /**
     * In case the PasswordReset was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PasswordResetUpdateInput, PasswordResetUncheckedUpdateInput>
  }

  /**
   * PasswordReset delete
   */
  export type PasswordResetDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordReset
     */
    select?: PasswordResetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordReset
     */
    omit?: PasswordResetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetInclude<ExtArgs> | null
    /**
     * Filter which PasswordReset to delete.
     */
    where: PasswordResetWhereUniqueInput
  }

  /**
   * PasswordReset deleteMany
   */
  export type PasswordResetDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PasswordResets to delete
     */
    where?: PasswordResetWhereInput
    /**
     * Limit how many PasswordResets to delete.
     */
    limit?: number
  }

  /**
   * PasswordReset without action
   */
  export type PasswordResetDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordReset
     */
    select?: PasswordResetSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordReset
     */
    omit?: PasswordResetOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetInclude<ExtArgs> | null
  }


  /**
   * Model RefreshToken
   */

  export type AggregateRefreshToken = {
    _count: RefreshTokenCountAggregateOutputType | null
    _avg: RefreshTokenAvgAggregateOutputType | null
    _sum: RefreshTokenSumAggregateOutputType | null
    _min: RefreshTokenMinAggregateOutputType | null
    _max: RefreshTokenMaxAggregateOutputType | null
  }

  export type RefreshTokenAvgAggregateOutputType = {
    id: number | null
    userId: number | null
  }

  export type RefreshTokenSumAggregateOutputType = {
    id: number | null
    userId: number | null
  }

  export type RefreshTokenMinAggregateOutputType = {
    id: number | null
    userId: number | null
    token: string | null
    expiresAt: Date | null
    createdAt: Date | null
  }

  export type RefreshTokenMaxAggregateOutputType = {
    id: number | null
    userId: number | null
    token: string | null
    expiresAt: Date | null
    createdAt: Date | null
  }

  export type RefreshTokenCountAggregateOutputType = {
    id: number
    userId: number
    token: number
    expiresAt: number
    createdAt: number
    _all: number
  }


  export type RefreshTokenAvgAggregateInputType = {
    id?: true
    userId?: true
  }

  export type RefreshTokenSumAggregateInputType = {
    id?: true
    userId?: true
  }

  export type RefreshTokenMinAggregateInputType = {
    id?: true
    userId?: true
    token?: true
    expiresAt?: true
    createdAt?: true
  }

  export type RefreshTokenMaxAggregateInputType = {
    id?: true
    userId?: true
    token?: true
    expiresAt?: true
    createdAt?: true
  }

  export type RefreshTokenCountAggregateInputType = {
    id?: true
    userId?: true
    token?: true
    expiresAt?: true
    createdAt?: true
    _all?: true
  }

  export type RefreshTokenAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which RefreshToken to aggregate.
     */
    where?: RefreshTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RefreshTokens to fetch.
     */
    orderBy?: RefreshTokenOrderByWithRelationInput | RefreshTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: RefreshTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RefreshTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RefreshTokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned RefreshTokens
    **/
    _count?: true | RefreshTokenCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: RefreshTokenAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: RefreshTokenSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: RefreshTokenMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: RefreshTokenMaxAggregateInputType
  }

  export type GetRefreshTokenAggregateType<T extends RefreshTokenAggregateArgs> = {
        [P in keyof T & keyof AggregateRefreshToken]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateRefreshToken[P]>
      : GetScalarType<T[P], AggregateRefreshToken[P]>
  }




  export type RefreshTokenGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RefreshTokenWhereInput
    orderBy?: RefreshTokenOrderByWithAggregationInput | RefreshTokenOrderByWithAggregationInput[]
    by: RefreshTokenScalarFieldEnum[] | RefreshTokenScalarFieldEnum
    having?: RefreshTokenScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: RefreshTokenCountAggregateInputType | true
    _avg?: RefreshTokenAvgAggregateInputType
    _sum?: RefreshTokenSumAggregateInputType
    _min?: RefreshTokenMinAggregateInputType
    _max?: RefreshTokenMaxAggregateInputType
  }

  export type RefreshTokenGroupByOutputType = {
    id: number
    userId: number
    token: string
    expiresAt: Date
    createdAt: Date
    _count: RefreshTokenCountAggregateOutputType | null
    _avg: RefreshTokenAvgAggregateOutputType | null
    _sum: RefreshTokenSumAggregateOutputType | null
    _min: RefreshTokenMinAggregateOutputType | null
    _max: RefreshTokenMaxAggregateOutputType | null
  }

  type GetRefreshTokenGroupByPayload<T extends RefreshTokenGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<RefreshTokenGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof RefreshTokenGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], RefreshTokenGroupByOutputType[P]>
            : GetScalarType<T[P], RefreshTokenGroupByOutputType[P]>
        }
      >
    >


  export type RefreshTokenSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    token?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["refreshToken"]>



  export type RefreshTokenSelectScalar = {
    id?: boolean
    userId?: boolean
    token?: boolean
    expiresAt?: boolean
    createdAt?: boolean
  }

  export type RefreshTokenOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "token" | "expiresAt" | "createdAt", ExtArgs["result"]["refreshToken"]>
  export type RefreshTokenInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $RefreshTokenPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "RefreshToken"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      userId: number
      token: string
      expiresAt: Date
      createdAt: Date
    }, ExtArgs["result"]["refreshToken"]>
    composites: {}
  }

  type RefreshTokenGetPayload<S extends boolean | null | undefined | RefreshTokenDefaultArgs> = $Result.GetResult<Prisma.$RefreshTokenPayload, S>

  type RefreshTokenCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<RefreshTokenFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: RefreshTokenCountAggregateInputType | true
    }

  export interface RefreshTokenDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['RefreshToken'], meta: { name: 'RefreshToken' } }
    /**
     * Find zero or one RefreshToken that matches the filter.
     * @param {RefreshTokenFindUniqueArgs} args - Arguments to find a RefreshToken
     * @example
     * // Get one RefreshToken
     * const refreshToken = await prisma.refreshToken.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends RefreshTokenFindUniqueArgs>(args: SelectSubset<T, RefreshTokenFindUniqueArgs<ExtArgs>>): Prisma__RefreshTokenClient<$Result.GetResult<Prisma.$RefreshTokenPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one RefreshToken that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {RefreshTokenFindUniqueOrThrowArgs} args - Arguments to find a RefreshToken
     * @example
     * // Get one RefreshToken
     * const refreshToken = await prisma.refreshToken.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends RefreshTokenFindUniqueOrThrowArgs>(args: SelectSubset<T, RefreshTokenFindUniqueOrThrowArgs<ExtArgs>>): Prisma__RefreshTokenClient<$Result.GetResult<Prisma.$RefreshTokenPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first RefreshToken that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RefreshTokenFindFirstArgs} args - Arguments to find a RefreshToken
     * @example
     * // Get one RefreshToken
     * const refreshToken = await prisma.refreshToken.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends RefreshTokenFindFirstArgs>(args?: SelectSubset<T, RefreshTokenFindFirstArgs<ExtArgs>>): Prisma__RefreshTokenClient<$Result.GetResult<Prisma.$RefreshTokenPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first RefreshToken that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RefreshTokenFindFirstOrThrowArgs} args - Arguments to find a RefreshToken
     * @example
     * // Get one RefreshToken
     * const refreshToken = await prisma.refreshToken.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends RefreshTokenFindFirstOrThrowArgs>(args?: SelectSubset<T, RefreshTokenFindFirstOrThrowArgs<ExtArgs>>): Prisma__RefreshTokenClient<$Result.GetResult<Prisma.$RefreshTokenPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more RefreshTokens that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RefreshTokenFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all RefreshTokens
     * const refreshTokens = await prisma.refreshToken.findMany()
     * 
     * // Get first 10 RefreshTokens
     * const refreshTokens = await prisma.refreshToken.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const refreshTokenWithIdOnly = await prisma.refreshToken.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends RefreshTokenFindManyArgs>(args?: SelectSubset<T, RefreshTokenFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RefreshTokenPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a RefreshToken.
     * @param {RefreshTokenCreateArgs} args - Arguments to create a RefreshToken.
     * @example
     * // Create one RefreshToken
     * const RefreshToken = await prisma.refreshToken.create({
     *   data: {
     *     // ... data to create a RefreshToken
     *   }
     * })
     * 
     */
    create<T extends RefreshTokenCreateArgs>(args: SelectSubset<T, RefreshTokenCreateArgs<ExtArgs>>): Prisma__RefreshTokenClient<$Result.GetResult<Prisma.$RefreshTokenPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many RefreshTokens.
     * @param {RefreshTokenCreateManyArgs} args - Arguments to create many RefreshTokens.
     * @example
     * // Create many RefreshTokens
     * const refreshToken = await prisma.refreshToken.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends RefreshTokenCreateManyArgs>(args?: SelectSubset<T, RefreshTokenCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a RefreshToken.
     * @param {RefreshTokenDeleteArgs} args - Arguments to delete one RefreshToken.
     * @example
     * // Delete one RefreshToken
     * const RefreshToken = await prisma.refreshToken.delete({
     *   where: {
     *     // ... filter to delete one RefreshToken
     *   }
     * })
     * 
     */
    delete<T extends RefreshTokenDeleteArgs>(args: SelectSubset<T, RefreshTokenDeleteArgs<ExtArgs>>): Prisma__RefreshTokenClient<$Result.GetResult<Prisma.$RefreshTokenPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one RefreshToken.
     * @param {RefreshTokenUpdateArgs} args - Arguments to update one RefreshToken.
     * @example
     * // Update one RefreshToken
     * const refreshToken = await prisma.refreshToken.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends RefreshTokenUpdateArgs>(args: SelectSubset<T, RefreshTokenUpdateArgs<ExtArgs>>): Prisma__RefreshTokenClient<$Result.GetResult<Prisma.$RefreshTokenPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more RefreshTokens.
     * @param {RefreshTokenDeleteManyArgs} args - Arguments to filter RefreshTokens to delete.
     * @example
     * // Delete a few RefreshTokens
     * const { count } = await prisma.refreshToken.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends RefreshTokenDeleteManyArgs>(args?: SelectSubset<T, RefreshTokenDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more RefreshTokens.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RefreshTokenUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many RefreshTokens
     * const refreshToken = await prisma.refreshToken.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends RefreshTokenUpdateManyArgs>(args: SelectSubset<T, RefreshTokenUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one RefreshToken.
     * @param {RefreshTokenUpsertArgs} args - Arguments to update or create a RefreshToken.
     * @example
     * // Update or create a RefreshToken
     * const refreshToken = await prisma.refreshToken.upsert({
     *   create: {
     *     // ... data to create a RefreshToken
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the RefreshToken we want to update
     *   }
     * })
     */
    upsert<T extends RefreshTokenUpsertArgs>(args: SelectSubset<T, RefreshTokenUpsertArgs<ExtArgs>>): Prisma__RefreshTokenClient<$Result.GetResult<Prisma.$RefreshTokenPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of RefreshTokens.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RefreshTokenCountArgs} args - Arguments to filter RefreshTokens to count.
     * @example
     * // Count the number of RefreshTokens
     * const count = await prisma.refreshToken.count({
     *   where: {
     *     // ... the filter for the RefreshTokens we want to count
     *   }
     * })
    **/
    count<T extends RefreshTokenCountArgs>(
      args?: Subset<T, RefreshTokenCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], RefreshTokenCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a RefreshToken.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RefreshTokenAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends RefreshTokenAggregateArgs>(args: Subset<T, RefreshTokenAggregateArgs>): Prisma.PrismaPromise<GetRefreshTokenAggregateType<T>>

    /**
     * Group by RefreshToken.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RefreshTokenGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends RefreshTokenGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: RefreshTokenGroupByArgs['orderBy'] }
        : { orderBy?: RefreshTokenGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, RefreshTokenGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRefreshTokenGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the RefreshToken model
   */
  readonly fields: RefreshTokenFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for RefreshToken.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__RefreshTokenClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the RefreshToken model
   */
  interface RefreshTokenFieldRefs {
    readonly id: FieldRef<"RefreshToken", 'Int'>
    readonly userId: FieldRef<"RefreshToken", 'Int'>
    readonly token: FieldRef<"RefreshToken", 'String'>
    readonly expiresAt: FieldRef<"RefreshToken", 'DateTime'>
    readonly createdAt: FieldRef<"RefreshToken", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * RefreshToken findUnique
   */
  export type RefreshTokenFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RefreshToken
     */
    select?: RefreshTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RefreshToken
     */
    omit?: RefreshTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefreshTokenInclude<ExtArgs> | null
    /**
     * Filter, which RefreshToken to fetch.
     */
    where: RefreshTokenWhereUniqueInput
  }

  /**
   * RefreshToken findUniqueOrThrow
   */
  export type RefreshTokenFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RefreshToken
     */
    select?: RefreshTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RefreshToken
     */
    omit?: RefreshTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefreshTokenInclude<ExtArgs> | null
    /**
     * Filter, which RefreshToken to fetch.
     */
    where: RefreshTokenWhereUniqueInput
  }

  /**
   * RefreshToken findFirst
   */
  export type RefreshTokenFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RefreshToken
     */
    select?: RefreshTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RefreshToken
     */
    omit?: RefreshTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefreshTokenInclude<ExtArgs> | null
    /**
     * Filter, which RefreshToken to fetch.
     */
    where?: RefreshTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RefreshTokens to fetch.
     */
    orderBy?: RefreshTokenOrderByWithRelationInput | RefreshTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for RefreshTokens.
     */
    cursor?: RefreshTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RefreshTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RefreshTokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of RefreshTokens.
     */
    distinct?: RefreshTokenScalarFieldEnum | RefreshTokenScalarFieldEnum[]
  }

  /**
   * RefreshToken findFirstOrThrow
   */
  export type RefreshTokenFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RefreshToken
     */
    select?: RefreshTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RefreshToken
     */
    omit?: RefreshTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefreshTokenInclude<ExtArgs> | null
    /**
     * Filter, which RefreshToken to fetch.
     */
    where?: RefreshTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RefreshTokens to fetch.
     */
    orderBy?: RefreshTokenOrderByWithRelationInput | RefreshTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for RefreshTokens.
     */
    cursor?: RefreshTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RefreshTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RefreshTokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of RefreshTokens.
     */
    distinct?: RefreshTokenScalarFieldEnum | RefreshTokenScalarFieldEnum[]
  }

  /**
   * RefreshToken findMany
   */
  export type RefreshTokenFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RefreshToken
     */
    select?: RefreshTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RefreshToken
     */
    omit?: RefreshTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefreshTokenInclude<ExtArgs> | null
    /**
     * Filter, which RefreshTokens to fetch.
     */
    where?: RefreshTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RefreshTokens to fetch.
     */
    orderBy?: RefreshTokenOrderByWithRelationInput | RefreshTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing RefreshTokens.
     */
    cursor?: RefreshTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RefreshTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RefreshTokens.
     */
    skip?: number
    distinct?: RefreshTokenScalarFieldEnum | RefreshTokenScalarFieldEnum[]
  }

  /**
   * RefreshToken create
   */
  export type RefreshTokenCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RefreshToken
     */
    select?: RefreshTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RefreshToken
     */
    omit?: RefreshTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefreshTokenInclude<ExtArgs> | null
    /**
     * The data needed to create a RefreshToken.
     */
    data: XOR<RefreshTokenCreateInput, RefreshTokenUncheckedCreateInput>
  }

  /**
   * RefreshToken createMany
   */
  export type RefreshTokenCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many RefreshTokens.
     */
    data: RefreshTokenCreateManyInput | RefreshTokenCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * RefreshToken update
   */
  export type RefreshTokenUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RefreshToken
     */
    select?: RefreshTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RefreshToken
     */
    omit?: RefreshTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefreshTokenInclude<ExtArgs> | null
    /**
     * The data needed to update a RefreshToken.
     */
    data: XOR<RefreshTokenUpdateInput, RefreshTokenUncheckedUpdateInput>
    /**
     * Choose, which RefreshToken to update.
     */
    where: RefreshTokenWhereUniqueInput
  }

  /**
   * RefreshToken updateMany
   */
  export type RefreshTokenUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update RefreshTokens.
     */
    data: XOR<RefreshTokenUpdateManyMutationInput, RefreshTokenUncheckedUpdateManyInput>
    /**
     * Filter which RefreshTokens to update
     */
    where?: RefreshTokenWhereInput
    /**
     * Limit how many RefreshTokens to update.
     */
    limit?: number
  }

  /**
   * RefreshToken upsert
   */
  export type RefreshTokenUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RefreshToken
     */
    select?: RefreshTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RefreshToken
     */
    omit?: RefreshTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefreshTokenInclude<ExtArgs> | null
    /**
     * The filter to search for the RefreshToken to update in case it exists.
     */
    where: RefreshTokenWhereUniqueInput
    /**
     * In case the RefreshToken found by the `where` argument doesn't exist, create a new RefreshToken with this data.
     */
    create: XOR<RefreshTokenCreateInput, RefreshTokenUncheckedCreateInput>
    /**
     * In case the RefreshToken was found with the provided `where` argument, update it with this data.
     */
    update: XOR<RefreshTokenUpdateInput, RefreshTokenUncheckedUpdateInput>
  }

  /**
   * RefreshToken delete
   */
  export type RefreshTokenDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RefreshToken
     */
    select?: RefreshTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RefreshToken
     */
    omit?: RefreshTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefreshTokenInclude<ExtArgs> | null
    /**
     * Filter which RefreshToken to delete.
     */
    where: RefreshTokenWhereUniqueInput
  }

  /**
   * RefreshToken deleteMany
   */
  export type RefreshTokenDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which RefreshTokens to delete
     */
    where?: RefreshTokenWhereInput
    /**
     * Limit how many RefreshTokens to delete.
     */
    limit?: number
  }

  /**
   * RefreshToken without action
   */
  export type RefreshTokenDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RefreshToken
     */
    select?: RefreshTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RefreshToken
     */
    omit?: RefreshTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RefreshTokenInclude<ExtArgs> | null
  }


  /**
   * Model events
   */

  export type AggregateEvents = {
    _count: EventsCountAggregateOutputType | null
    _avg: EventsAvgAggregateOutputType | null
    _sum: EventsSumAggregateOutputType | null
    _min: EventsMinAggregateOutputType | null
    _max: EventsMaxAggregateOutputType | null
  }

  export type EventsAvgAggregateOutputType = {
    id: number | null
    userId: number | null
  }

  export type EventsSumAggregateOutputType = {
    id: number | null
    userId: number | null
  }

  export type EventsMinAggregateOutputType = {
    id: number | null
    userId: number | null
    title: string | null
    description: string | null
    date: Date | null
    end_date: Date | null
    location: string | null
  }

  export type EventsMaxAggregateOutputType = {
    id: number | null
    userId: number | null
    title: string | null
    description: string | null
    date: Date | null
    end_date: Date | null
    location: string | null
  }

  export type EventsCountAggregateOutputType = {
    id: number
    userId: number
    title: number
    description: number
    date: number
    end_date: number
    location: number
    _all: number
  }


  export type EventsAvgAggregateInputType = {
    id?: true
    userId?: true
  }

  export type EventsSumAggregateInputType = {
    id?: true
    userId?: true
  }

  export type EventsMinAggregateInputType = {
    id?: true
    userId?: true
    title?: true
    description?: true
    date?: true
    end_date?: true
    location?: true
  }

  export type EventsMaxAggregateInputType = {
    id?: true
    userId?: true
    title?: true
    description?: true
    date?: true
    end_date?: true
    location?: true
  }

  export type EventsCountAggregateInputType = {
    id?: true
    userId?: true
    title?: true
    description?: true
    date?: true
    end_date?: true
    location?: true
    _all?: true
  }

  export type EventsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which events to aggregate.
     */
    where?: eventsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of events to fetch.
     */
    orderBy?: eventsOrderByWithRelationInput | eventsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: eventsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` events from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` events.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned events
    **/
    _count?: true | EventsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: EventsAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: EventsSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: EventsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: EventsMaxAggregateInputType
  }

  export type GetEventsAggregateType<T extends EventsAggregateArgs> = {
        [P in keyof T & keyof AggregateEvents]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEvents[P]>
      : GetScalarType<T[P], AggregateEvents[P]>
  }




  export type eventsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: eventsWhereInput
    orderBy?: eventsOrderByWithAggregationInput | eventsOrderByWithAggregationInput[]
    by: EventsScalarFieldEnum[] | EventsScalarFieldEnum
    having?: eventsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: EventsCountAggregateInputType | true
    _avg?: EventsAvgAggregateInputType
    _sum?: EventsSumAggregateInputType
    _min?: EventsMinAggregateInputType
    _max?: EventsMaxAggregateInputType
  }

  export type EventsGroupByOutputType = {
    id: number
    userId: number
    title: string
    description: string | null
    date: Date | null
    end_date: Date | null
    location: string | null
    _count: EventsCountAggregateOutputType | null
    _avg: EventsAvgAggregateOutputType | null
    _sum: EventsSumAggregateOutputType | null
    _min: EventsMinAggregateOutputType | null
    _max: EventsMaxAggregateOutputType | null
  }

  type GetEventsGroupByPayload<T extends eventsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EventsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof EventsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EventsGroupByOutputType[P]>
            : GetScalarType<T[P], EventsGroupByOutputType[P]>
        }
      >
    >


  export type eventsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    title?: boolean
    description?: boolean
    date?: boolean
    end_date?: boolean
    location?: boolean
    life_events?: boolean | events$life_eventsArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
    _count?: boolean | EventsCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["events"]>



  export type eventsSelectScalar = {
    id?: boolean
    userId?: boolean
    title?: boolean
    description?: boolean
    date?: boolean
    end_date?: boolean
    location?: boolean
  }

  export type eventsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "title" | "description" | "date" | "end_date" | "location", ExtArgs["result"]["events"]>
  export type eventsInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    life_events?: boolean | events$life_eventsArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
    _count?: boolean | EventsCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $eventsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "events"
    objects: {
      life_events: Prisma.$life_eventsPayload<ExtArgs>[]
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      userId: number
      title: string
      description: string | null
      date: Date | null
      end_date: Date | null
      location: string | null
    }, ExtArgs["result"]["events"]>
    composites: {}
  }

  type eventsGetPayload<S extends boolean | null | undefined | eventsDefaultArgs> = $Result.GetResult<Prisma.$eventsPayload, S>

  type eventsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<eventsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: EventsCountAggregateInputType | true
    }

  export interface eventsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['events'], meta: { name: 'events' } }
    /**
     * Find zero or one Events that matches the filter.
     * @param {eventsFindUniqueArgs} args - Arguments to find a Events
     * @example
     * // Get one Events
     * const events = await prisma.events.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends eventsFindUniqueArgs>(args: SelectSubset<T, eventsFindUniqueArgs<ExtArgs>>): Prisma__eventsClient<$Result.GetResult<Prisma.$eventsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Events that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {eventsFindUniqueOrThrowArgs} args - Arguments to find a Events
     * @example
     * // Get one Events
     * const events = await prisma.events.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends eventsFindUniqueOrThrowArgs>(args: SelectSubset<T, eventsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__eventsClient<$Result.GetResult<Prisma.$eventsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Events that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {eventsFindFirstArgs} args - Arguments to find a Events
     * @example
     * // Get one Events
     * const events = await prisma.events.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends eventsFindFirstArgs>(args?: SelectSubset<T, eventsFindFirstArgs<ExtArgs>>): Prisma__eventsClient<$Result.GetResult<Prisma.$eventsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Events that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {eventsFindFirstOrThrowArgs} args - Arguments to find a Events
     * @example
     * // Get one Events
     * const events = await prisma.events.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends eventsFindFirstOrThrowArgs>(args?: SelectSubset<T, eventsFindFirstOrThrowArgs<ExtArgs>>): Prisma__eventsClient<$Result.GetResult<Prisma.$eventsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Events that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {eventsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Events
     * const events = await prisma.events.findMany()
     * 
     * // Get first 10 Events
     * const events = await prisma.events.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const eventsWithIdOnly = await prisma.events.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends eventsFindManyArgs>(args?: SelectSubset<T, eventsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$eventsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Events.
     * @param {eventsCreateArgs} args - Arguments to create a Events.
     * @example
     * // Create one Events
     * const Events = await prisma.events.create({
     *   data: {
     *     // ... data to create a Events
     *   }
     * })
     * 
     */
    create<T extends eventsCreateArgs>(args: SelectSubset<T, eventsCreateArgs<ExtArgs>>): Prisma__eventsClient<$Result.GetResult<Prisma.$eventsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Events.
     * @param {eventsCreateManyArgs} args - Arguments to create many Events.
     * @example
     * // Create many Events
     * const events = await prisma.events.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends eventsCreateManyArgs>(args?: SelectSubset<T, eventsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Events.
     * @param {eventsDeleteArgs} args - Arguments to delete one Events.
     * @example
     * // Delete one Events
     * const Events = await prisma.events.delete({
     *   where: {
     *     // ... filter to delete one Events
     *   }
     * })
     * 
     */
    delete<T extends eventsDeleteArgs>(args: SelectSubset<T, eventsDeleteArgs<ExtArgs>>): Prisma__eventsClient<$Result.GetResult<Prisma.$eventsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Events.
     * @param {eventsUpdateArgs} args - Arguments to update one Events.
     * @example
     * // Update one Events
     * const events = await prisma.events.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends eventsUpdateArgs>(args: SelectSubset<T, eventsUpdateArgs<ExtArgs>>): Prisma__eventsClient<$Result.GetResult<Prisma.$eventsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Events.
     * @param {eventsDeleteManyArgs} args - Arguments to filter Events to delete.
     * @example
     * // Delete a few Events
     * const { count } = await prisma.events.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends eventsDeleteManyArgs>(args?: SelectSubset<T, eventsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Events.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {eventsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Events
     * const events = await prisma.events.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends eventsUpdateManyArgs>(args: SelectSubset<T, eventsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Events.
     * @param {eventsUpsertArgs} args - Arguments to update or create a Events.
     * @example
     * // Update or create a Events
     * const events = await prisma.events.upsert({
     *   create: {
     *     // ... data to create a Events
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Events we want to update
     *   }
     * })
     */
    upsert<T extends eventsUpsertArgs>(args: SelectSubset<T, eventsUpsertArgs<ExtArgs>>): Prisma__eventsClient<$Result.GetResult<Prisma.$eventsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Events.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {eventsCountArgs} args - Arguments to filter Events to count.
     * @example
     * // Count the number of Events
     * const count = await prisma.events.count({
     *   where: {
     *     // ... the filter for the Events we want to count
     *   }
     * })
    **/
    count<T extends eventsCountArgs>(
      args?: Subset<T, eventsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], EventsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Events.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends EventsAggregateArgs>(args: Subset<T, EventsAggregateArgs>): Prisma.PrismaPromise<GetEventsAggregateType<T>>

    /**
     * Group by Events.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {eventsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends eventsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: eventsGroupByArgs['orderBy'] }
        : { orderBy?: eventsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, eventsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEventsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the events model
   */
  readonly fields: eventsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for events.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__eventsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    life_events<T extends events$life_eventsArgs<ExtArgs> = {}>(args?: Subset<T, events$life_eventsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$life_eventsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the events model
   */
  interface eventsFieldRefs {
    readonly id: FieldRef<"events", 'Int'>
    readonly userId: FieldRef<"events", 'Int'>
    readonly title: FieldRef<"events", 'String'>
    readonly description: FieldRef<"events", 'String'>
    readonly date: FieldRef<"events", 'DateTime'>
    readonly end_date: FieldRef<"events", 'DateTime'>
    readonly location: FieldRef<"events", 'String'>
  }
    

  // Custom InputTypes
  /**
   * events findUnique
   */
  export type eventsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the events
     */
    select?: eventsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the events
     */
    omit?: eventsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: eventsInclude<ExtArgs> | null
    /**
     * Filter, which events to fetch.
     */
    where: eventsWhereUniqueInput
  }

  /**
   * events findUniqueOrThrow
   */
  export type eventsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the events
     */
    select?: eventsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the events
     */
    omit?: eventsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: eventsInclude<ExtArgs> | null
    /**
     * Filter, which events to fetch.
     */
    where: eventsWhereUniqueInput
  }

  /**
   * events findFirst
   */
  export type eventsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the events
     */
    select?: eventsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the events
     */
    omit?: eventsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: eventsInclude<ExtArgs> | null
    /**
     * Filter, which events to fetch.
     */
    where?: eventsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of events to fetch.
     */
    orderBy?: eventsOrderByWithRelationInput | eventsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for events.
     */
    cursor?: eventsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` events from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` events.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of events.
     */
    distinct?: EventsScalarFieldEnum | EventsScalarFieldEnum[]
  }

  /**
   * events findFirstOrThrow
   */
  export type eventsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the events
     */
    select?: eventsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the events
     */
    omit?: eventsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: eventsInclude<ExtArgs> | null
    /**
     * Filter, which events to fetch.
     */
    where?: eventsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of events to fetch.
     */
    orderBy?: eventsOrderByWithRelationInput | eventsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for events.
     */
    cursor?: eventsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` events from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` events.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of events.
     */
    distinct?: EventsScalarFieldEnum | EventsScalarFieldEnum[]
  }

  /**
   * events findMany
   */
  export type eventsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the events
     */
    select?: eventsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the events
     */
    omit?: eventsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: eventsInclude<ExtArgs> | null
    /**
     * Filter, which events to fetch.
     */
    where?: eventsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of events to fetch.
     */
    orderBy?: eventsOrderByWithRelationInput | eventsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing events.
     */
    cursor?: eventsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` events from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` events.
     */
    skip?: number
    distinct?: EventsScalarFieldEnum | EventsScalarFieldEnum[]
  }

  /**
   * events create
   */
  export type eventsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the events
     */
    select?: eventsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the events
     */
    omit?: eventsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: eventsInclude<ExtArgs> | null
    /**
     * The data needed to create a events.
     */
    data: XOR<eventsCreateInput, eventsUncheckedCreateInput>
  }

  /**
   * events createMany
   */
  export type eventsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many events.
     */
    data: eventsCreateManyInput | eventsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * events update
   */
  export type eventsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the events
     */
    select?: eventsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the events
     */
    omit?: eventsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: eventsInclude<ExtArgs> | null
    /**
     * The data needed to update a events.
     */
    data: XOR<eventsUpdateInput, eventsUncheckedUpdateInput>
    /**
     * Choose, which events to update.
     */
    where: eventsWhereUniqueInput
  }

  /**
   * events updateMany
   */
  export type eventsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update events.
     */
    data: XOR<eventsUpdateManyMutationInput, eventsUncheckedUpdateManyInput>
    /**
     * Filter which events to update
     */
    where?: eventsWhereInput
    /**
     * Limit how many events to update.
     */
    limit?: number
  }

  /**
   * events upsert
   */
  export type eventsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the events
     */
    select?: eventsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the events
     */
    omit?: eventsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: eventsInclude<ExtArgs> | null
    /**
     * The filter to search for the events to update in case it exists.
     */
    where: eventsWhereUniqueInput
    /**
     * In case the events found by the `where` argument doesn't exist, create a new events with this data.
     */
    create: XOR<eventsCreateInput, eventsUncheckedCreateInput>
    /**
     * In case the events was found with the provided `where` argument, update it with this data.
     */
    update: XOR<eventsUpdateInput, eventsUncheckedUpdateInput>
  }

  /**
   * events delete
   */
  export type eventsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the events
     */
    select?: eventsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the events
     */
    omit?: eventsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: eventsInclude<ExtArgs> | null
    /**
     * Filter which events to delete.
     */
    where: eventsWhereUniqueInput
  }

  /**
   * events deleteMany
   */
  export type eventsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which events to delete
     */
    where?: eventsWhereInput
    /**
     * Limit how many events to delete.
     */
    limit?: number
  }

  /**
   * events.life_events
   */
  export type events$life_eventsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the life_events
     */
    select?: life_eventsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the life_events
     */
    omit?: life_eventsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: life_eventsInclude<ExtArgs> | null
    where?: life_eventsWhereInput
    orderBy?: life_eventsOrderByWithRelationInput | life_eventsOrderByWithRelationInput[]
    cursor?: life_eventsWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Life_eventsScalarFieldEnum | Life_eventsScalarFieldEnum[]
  }

  /**
   * events without action
   */
  export type eventsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the events
     */
    select?: eventsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the events
     */
    omit?: eventsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: eventsInclude<ExtArgs> | null
  }


  /**
   * Model event_types
   */

  export type AggregateEvent_types = {
    _count: Event_typesCountAggregateOutputType | null
    _avg: Event_typesAvgAggregateOutputType | null
    _sum: Event_typesSumAggregateOutputType | null
    _min: Event_typesMinAggregateOutputType | null
    _max: Event_typesMaxAggregateOutputType | null
  }

  export type Event_typesAvgAggregateOutputType = {
    id: number | null
    userId: number | null
  }

  export type Event_typesSumAggregateOutputType = {
    id: number | null
    userId: number | null
  }

  export type Event_typesMinAggregateOutputType = {
    id: number | null
    userId: number | null
    name: string | null
    icon: string | null
    color: string | null
  }

  export type Event_typesMaxAggregateOutputType = {
    id: number | null
    userId: number | null
    name: string | null
    icon: string | null
    color: string | null
  }

  export type Event_typesCountAggregateOutputType = {
    id: number
    userId: number
    name: number
    icon: number
    color: number
    _all: number
  }


  export type Event_typesAvgAggregateInputType = {
    id?: true
    userId?: true
  }

  export type Event_typesSumAggregateInputType = {
    id?: true
    userId?: true
  }

  export type Event_typesMinAggregateInputType = {
    id?: true
    userId?: true
    name?: true
    icon?: true
    color?: true
  }

  export type Event_typesMaxAggregateInputType = {
    id?: true
    userId?: true
    name?: true
    icon?: true
    color?: true
  }

  export type Event_typesCountAggregateInputType = {
    id?: true
    userId?: true
    name?: true
    icon?: true
    color?: true
    _all?: true
  }

  export type Event_typesAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which event_types to aggregate.
     */
    where?: event_typesWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of event_types to fetch.
     */
    orderBy?: event_typesOrderByWithRelationInput | event_typesOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: event_typesWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` event_types from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` event_types.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned event_types
    **/
    _count?: true | Event_typesCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Event_typesAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Event_typesSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Event_typesMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Event_typesMaxAggregateInputType
  }

  export type GetEvent_typesAggregateType<T extends Event_typesAggregateArgs> = {
        [P in keyof T & keyof AggregateEvent_types]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEvent_types[P]>
      : GetScalarType<T[P], AggregateEvent_types[P]>
  }




  export type event_typesGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: event_typesWhereInput
    orderBy?: event_typesOrderByWithAggregationInput | event_typesOrderByWithAggregationInput[]
    by: Event_typesScalarFieldEnum[] | Event_typesScalarFieldEnum
    having?: event_typesScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Event_typesCountAggregateInputType | true
    _avg?: Event_typesAvgAggregateInputType
    _sum?: Event_typesSumAggregateInputType
    _min?: Event_typesMinAggregateInputType
    _max?: Event_typesMaxAggregateInputType
  }

  export type Event_typesGroupByOutputType = {
    id: number
    userId: number
    name: string | null
    icon: string | null
    color: string | null
    _count: Event_typesCountAggregateOutputType | null
    _avg: Event_typesAvgAggregateOutputType | null
    _sum: Event_typesSumAggregateOutputType | null
    _min: Event_typesMinAggregateOutputType | null
    _max: Event_typesMaxAggregateOutputType | null
  }

  type GetEvent_typesGroupByPayload<T extends event_typesGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Event_typesGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Event_typesGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Event_typesGroupByOutputType[P]>
            : GetScalarType<T[P], Event_typesGroupByOutputType[P]>
        }
      >
    >


  export type event_typesSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    name?: boolean
    icon?: boolean
    color?: boolean
    life_events?: boolean | event_types$life_eventsArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
    _count?: boolean | Event_typesCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["event_types"]>



  export type event_typesSelectScalar = {
    id?: boolean
    userId?: boolean
    name?: boolean
    icon?: boolean
    color?: boolean
  }

  export type event_typesOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "name" | "icon" | "color", ExtArgs["result"]["event_types"]>
  export type event_typesInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    life_events?: boolean | event_types$life_eventsArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
    _count?: boolean | Event_typesCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $event_typesPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "event_types"
    objects: {
      life_events: Prisma.$life_eventsPayload<ExtArgs>[]
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      userId: number
      name: string | null
      icon: string | null
      color: string | null
    }, ExtArgs["result"]["event_types"]>
    composites: {}
  }

  type event_typesGetPayload<S extends boolean | null | undefined | event_typesDefaultArgs> = $Result.GetResult<Prisma.$event_typesPayload, S>

  type event_typesCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<event_typesFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Event_typesCountAggregateInputType | true
    }

  export interface event_typesDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['event_types'], meta: { name: 'event_types' } }
    /**
     * Find zero or one Event_types that matches the filter.
     * @param {event_typesFindUniqueArgs} args - Arguments to find a Event_types
     * @example
     * // Get one Event_types
     * const event_types = await prisma.event_types.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends event_typesFindUniqueArgs>(args: SelectSubset<T, event_typesFindUniqueArgs<ExtArgs>>): Prisma__event_typesClient<$Result.GetResult<Prisma.$event_typesPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Event_types that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {event_typesFindUniqueOrThrowArgs} args - Arguments to find a Event_types
     * @example
     * // Get one Event_types
     * const event_types = await prisma.event_types.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends event_typesFindUniqueOrThrowArgs>(args: SelectSubset<T, event_typesFindUniqueOrThrowArgs<ExtArgs>>): Prisma__event_typesClient<$Result.GetResult<Prisma.$event_typesPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Event_types that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {event_typesFindFirstArgs} args - Arguments to find a Event_types
     * @example
     * // Get one Event_types
     * const event_types = await prisma.event_types.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends event_typesFindFirstArgs>(args?: SelectSubset<T, event_typesFindFirstArgs<ExtArgs>>): Prisma__event_typesClient<$Result.GetResult<Prisma.$event_typesPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Event_types that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {event_typesFindFirstOrThrowArgs} args - Arguments to find a Event_types
     * @example
     * // Get one Event_types
     * const event_types = await prisma.event_types.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends event_typesFindFirstOrThrowArgs>(args?: SelectSubset<T, event_typesFindFirstOrThrowArgs<ExtArgs>>): Prisma__event_typesClient<$Result.GetResult<Prisma.$event_typesPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Event_types that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {event_typesFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Event_types
     * const event_types = await prisma.event_types.findMany()
     * 
     * // Get first 10 Event_types
     * const event_types = await prisma.event_types.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const event_typesWithIdOnly = await prisma.event_types.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends event_typesFindManyArgs>(args?: SelectSubset<T, event_typesFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$event_typesPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Event_types.
     * @param {event_typesCreateArgs} args - Arguments to create a Event_types.
     * @example
     * // Create one Event_types
     * const Event_types = await prisma.event_types.create({
     *   data: {
     *     // ... data to create a Event_types
     *   }
     * })
     * 
     */
    create<T extends event_typesCreateArgs>(args: SelectSubset<T, event_typesCreateArgs<ExtArgs>>): Prisma__event_typesClient<$Result.GetResult<Prisma.$event_typesPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Event_types.
     * @param {event_typesCreateManyArgs} args - Arguments to create many Event_types.
     * @example
     * // Create many Event_types
     * const event_types = await prisma.event_types.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends event_typesCreateManyArgs>(args?: SelectSubset<T, event_typesCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Event_types.
     * @param {event_typesDeleteArgs} args - Arguments to delete one Event_types.
     * @example
     * // Delete one Event_types
     * const Event_types = await prisma.event_types.delete({
     *   where: {
     *     // ... filter to delete one Event_types
     *   }
     * })
     * 
     */
    delete<T extends event_typesDeleteArgs>(args: SelectSubset<T, event_typesDeleteArgs<ExtArgs>>): Prisma__event_typesClient<$Result.GetResult<Prisma.$event_typesPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Event_types.
     * @param {event_typesUpdateArgs} args - Arguments to update one Event_types.
     * @example
     * // Update one Event_types
     * const event_types = await prisma.event_types.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends event_typesUpdateArgs>(args: SelectSubset<T, event_typesUpdateArgs<ExtArgs>>): Prisma__event_typesClient<$Result.GetResult<Prisma.$event_typesPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Event_types.
     * @param {event_typesDeleteManyArgs} args - Arguments to filter Event_types to delete.
     * @example
     * // Delete a few Event_types
     * const { count } = await prisma.event_types.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends event_typesDeleteManyArgs>(args?: SelectSubset<T, event_typesDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Event_types.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {event_typesUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Event_types
     * const event_types = await prisma.event_types.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends event_typesUpdateManyArgs>(args: SelectSubset<T, event_typesUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Event_types.
     * @param {event_typesUpsertArgs} args - Arguments to update or create a Event_types.
     * @example
     * // Update or create a Event_types
     * const event_types = await prisma.event_types.upsert({
     *   create: {
     *     // ... data to create a Event_types
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Event_types we want to update
     *   }
     * })
     */
    upsert<T extends event_typesUpsertArgs>(args: SelectSubset<T, event_typesUpsertArgs<ExtArgs>>): Prisma__event_typesClient<$Result.GetResult<Prisma.$event_typesPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Event_types.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {event_typesCountArgs} args - Arguments to filter Event_types to count.
     * @example
     * // Count the number of Event_types
     * const count = await prisma.event_types.count({
     *   where: {
     *     // ... the filter for the Event_types we want to count
     *   }
     * })
    **/
    count<T extends event_typesCountArgs>(
      args?: Subset<T, event_typesCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Event_typesCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Event_types.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Event_typesAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Event_typesAggregateArgs>(args: Subset<T, Event_typesAggregateArgs>): Prisma.PrismaPromise<GetEvent_typesAggregateType<T>>

    /**
     * Group by Event_types.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {event_typesGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends event_typesGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: event_typesGroupByArgs['orderBy'] }
        : { orderBy?: event_typesGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, event_typesGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEvent_typesGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the event_types model
   */
  readonly fields: event_typesFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for event_types.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__event_typesClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    life_events<T extends event_types$life_eventsArgs<ExtArgs> = {}>(args?: Subset<T, event_types$life_eventsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$life_eventsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the event_types model
   */
  interface event_typesFieldRefs {
    readonly id: FieldRef<"event_types", 'Int'>
    readonly userId: FieldRef<"event_types", 'Int'>
    readonly name: FieldRef<"event_types", 'String'>
    readonly icon: FieldRef<"event_types", 'String'>
    readonly color: FieldRef<"event_types", 'String'>
  }
    

  // Custom InputTypes
  /**
   * event_types findUnique
   */
  export type event_typesFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the event_types
     */
    select?: event_typesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the event_types
     */
    omit?: event_typesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: event_typesInclude<ExtArgs> | null
    /**
     * Filter, which event_types to fetch.
     */
    where: event_typesWhereUniqueInput
  }

  /**
   * event_types findUniqueOrThrow
   */
  export type event_typesFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the event_types
     */
    select?: event_typesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the event_types
     */
    omit?: event_typesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: event_typesInclude<ExtArgs> | null
    /**
     * Filter, which event_types to fetch.
     */
    where: event_typesWhereUniqueInput
  }

  /**
   * event_types findFirst
   */
  export type event_typesFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the event_types
     */
    select?: event_typesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the event_types
     */
    omit?: event_typesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: event_typesInclude<ExtArgs> | null
    /**
     * Filter, which event_types to fetch.
     */
    where?: event_typesWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of event_types to fetch.
     */
    orderBy?: event_typesOrderByWithRelationInput | event_typesOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for event_types.
     */
    cursor?: event_typesWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` event_types from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` event_types.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of event_types.
     */
    distinct?: Event_typesScalarFieldEnum | Event_typesScalarFieldEnum[]
  }

  /**
   * event_types findFirstOrThrow
   */
  export type event_typesFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the event_types
     */
    select?: event_typesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the event_types
     */
    omit?: event_typesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: event_typesInclude<ExtArgs> | null
    /**
     * Filter, which event_types to fetch.
     */
    where?: event_typesWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of event_types to fetch.
     */
    orderBy?: event_typesOrderByWithRelationInput | event_typesOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for event_types.
     */
    cursor?: event_typesWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` event_types from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` event_types.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of event_types.
     */
    distinct?: Event_typesScalarFieldEnum | Event_typesScalarFieldEnum[]
  }

  /**
   * event_types findMany
   */
  export type event_typesFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the event_types
     */
    select?: event_typesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the event_types
     */
    omit?: event_typesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: event_typesInclude<ExtArgs> | null
    /**
     * Filter, which event_types to fetch.
     */
    where?: event_typesWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of event_types to fetch.
     */
    orderBy?: event_typesOrderByWithRelationInput | event_typesOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing event_types.
     */
    cursor?: event_typesWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` event_types from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` event_types.
     */
    skip?: number
    distinct?: Event_typesScalarFieldEnum | Event_typesScalarFieldEnum[]
  }

  /**
   * event_types create
   */
  export type event_typesCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the event_types
     */
    select?: event_typesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the event_types
     */
    omit?: event_typesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: event_typesInclude<ExtArgs> | null
    /**
     * The data needed to create a event_types.
     */
    data: XOR<event_typesCreateInput, event_typesUncheckedCreateInput>
  }

  /**
   * event_types createMany
   */
  export type event_typesCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many event_types.
     */
    data: event_typesCreateManyInput | event_typesCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * event_types update
   */
  export type event_typesUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the event_types
     */
    select?: event_typesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the event_types
     */
    omit?: event_typesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: event_typesInclude<ExtArgs> | null
    /**
     * The data needed to update a event_types.
     */
    data: XOR<event_typesUpdateInput, event_typesUncheckedUpdateInput>
    /**
     * Choose, which event_types to update.
     */
    where: event_typesWhereUniqueInput
  }

  /**
   * event_types updateMany
   */
  export type event_typesUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update event_types.
     */
    data: XOR<event_typesUpdateManyMutationInput, event_typesUncheckedUpdateManyInput>
    /**
     * Filter which event_types to update
     */
    where?: event_typesWhereInput
    /**
     * Limit how many event_types to update.
     */
    limit?: number
  }

  /**
   * event_types upsert
   */
  export type event_typesUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the event_types
     */
    select?: event_typesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the event_types
     */
    omit?: event_typesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: event_typesInclude<ExtArgs> | null
    /**
     * The filter to search for the event_types to update in case it exists.
     */
    where: event_typesWhereUniqueInput
    /**
     * In case the event_types found by the `where` argument doesn't exist, create a new event_types with this data.
     */
    create: XOR<event_typesCreateInput, event_typesUncheckedCreateInput>
    /**
     * In case the event_types was found with the provided `where` argument, update it with this data.
     */
    update: XOR<event_typesUpdateInput, event_typesUncheckedUpdateInput>
  }

  /**
   * event_types delete
   */
  export type event_typesDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the event_types
     */
    select?: event_typesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the event_types
     */
    omit?: event_typesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: event_typesInclude<ExtArgs> | null
    /**
     * Filter which event_types to delete.
     */
    where: event_typesWhereUniqueInput
  }

  /**
   * event_types deleteMany
   */
  export type event_typesDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which event_types to delete
     */
    where?: event_typesWhereInput
    /**
     * Limit how many event_types to delete.
     */
    limit?: number
  }

  /**
   * event_types.life_events
   */
  export type event_types$life_eventsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the life_events
     */
    select?: life_eventsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the life_events
     */
    omit?: life_eventsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: life_eventsInclude<ExtArgs> | null
    where?: life_eventsWhereInput
    orderBy?: life_eventsOrderByWithRelationInput | life_eventsOrderByWithRelationInput[]
    cursor?: life_eventsWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Life_eventsScalarFieldEnum | Life_eventsScalarFieldEnum[]
  }

  /**
   * event_types without action
   */
  export type event_typesDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the event_types
     */
    select?: event_typesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the event_types
     */
    omit?: event_typesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: event_typesInclude<ExtArgs> | null
  }


  /**
   * Model life_events
   */

  export type AggregateLife_events = {
    _count: Life_eventsCountAggregateOutputType | null
    _avg: Life_eventsAvgAggregateOutputType | null
    _sum: Life_eventsSumAggregateOutputType | null
    _min: Life_eventsMinAggregateOutputType | null
    _max: Life_eventsMaxAggregateOutputType | null
  }

  export type Life_eventsAvgAggregateOutputType = {
    id: number | null
    userId: number | null
    person_id: number | null
    event_id: number | null
    event_type_id: number | null
  }

  export type Life_eventsSumAggregateOutputType = {
    id: number | null
    userId: number | null
    person_id: number | null
    event_id: number | null
    event_type_id: number | null
  }

  export type Life_eventsMinAggregateOutputType = {
    id: number | null
    userId: number | null
    person_id: number | null
    event_id: number | null
    title: string | null
    start_date: Date | null
    end_date: Date | null
    location: string | null
    description: string | null
    event_type_id: number | null
  }

  export type Life_eventsMaxAggregateOutputType = {
    id: number | null
    userId: number | null
    person_id: number | null
    event_id: number | null
    title: string | null
    start_date: Date | null
    end_date: Date | null
    location: string | null
    description: string | null
    event_type_id: number | null
  }

  export type Life_eventsCountAggregateOutputType = {
    id: number
    userId: number
    person_id: number
    event_id: number
    title: number
    start_date: number
    end_date: number
    location: number
    description: number
    metadata: number
    event_type_id: number
    _all: number
  }


  export type Life_eventsAvgAggregateInputType = {
    id?: true
    userId?: true
    person_id?: true
    event_id?: true
    event_type_id?: true
  }

  export type Life_eventsSumAggregateInputType = {
    id?: true
    userId?: true
    person_id?: true
    event_id?: true
    event_type_id?: true
  }

  export type Life_eventsMinAggregateInputType = {
    id?: true
    userId?: true
    person_id?: true
    event_id?: true
    title?: true
    start_date?: true
    end_date?: true
    location?: true
    description?: true
    event_type_id?: true
  }

  export type Life_eventsMaxAggregateInputType = {
    id?: true
    userId?: true
    person_id?: true
    event_id?: true
    title?: true
    start_date?: true
    end_date?: true
    location?: true
    description?: true
    event_type_id?: true
  }

  export type Life_eventsCountAggregateInputType = {
    id?: true
    userId?: true
    person_id?: true
    event_id?: true
    title?: true
    start_date?: true
    end_date?: true
    location?: true
    description?: true
    metadata?: true
    event_type_id?: true
    _all?: true
  }

  export type Life_eventsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which life_events to aggregate.
     */
    where?: life_eventsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of life_events to fetch.
     */
    orderBy?: life_eventsOrderByWithRelationInput | life_eventsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: life_eventsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` life_events from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` life_events.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned life_events
    **/
    _count?: true | Life_eventsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Life_eventsAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Life_eventsSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Life_eventsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Life_eventsMaxAggregateInputType
  }

  export type GetLife_eventsAggregateType<T extends Life_eventsAggregateArgs> = {
        [P in keyof T & keyof AggregateLife_events]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLife_events[P]>
      : GetScalarType<T[P], AggregateLife_events[P]>
  }




  export type life_eventsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: life_eventsWhereInput
    orderBy?: life_eventsOrderByWithAggregationInput | life_eventsOrderByWithAggregationInput[]
    by: Life_eventsScalarFieldEnum[] | Life_eventsScalarFieldEnum
    having?: life_eventsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Life_eventsCountAggregateInputType | true
    _avg?: Life_eventsAvgAggregateInputType
    _sum?: Life_eventsSumAggregateInputType
    _min?: Life_eventsMinAggregateInputType
    _max?: Life_eventsMaxAggregateInputType
  }

  export type Life_eventsGroupByOutputType = {
    id: number
    userId: number
    person_id: number | null
    event_id: number | null
    title: string | null
    start_date: Date | null
    end_date: Date | null
    location: string | null
    description: string | null
    metadata: JsonValue | null
    event_type_id: number | null
    _count: Life_eventsCountAggregateOutputType | null
    _avg: Life_eventsAvgAggregateOutputType | null
    _sum: Life_eventsSumAggregateOutputType | null
    _min: Life_eventsMinAggregateOutputType | null
    _max: Life_eventsMaxAggregateOutputType | null
  }

  type GetLife_eventsGroupByPayload<T extends life_eventsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Life_eventsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Life_eventsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Life_eventsGroupByOutputType[P]>
            : GetScalarType<T[P], Life_eventsGroupByOutputType[P]>
        }
      >
    >


  export type life_eventsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    person_id?: boolean
    event_id?: boolean
    title?: boolean
    start_date?: boolean
    end_date?: boolean
    location?: boolean
    description?: boolean
    metadata?: boolean
    event_type_id?: boolean
    event?: boolean | life_events$eventArgs<ExtArgs>
    event_type?: boolean | life_events$event_typeArgs<ExtArgs>
    persons?: boolean | life_events$personsArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["life_events"]>



  export type life_eventsSelectScalar = {
    id?: boolean
    userId?: boolean
    person_id?: boolean
    event_id?: boolean
    title?: boolean
    start_date?: boolean
    end_date?: boolean
    location?: boolean
    description?: boolean
    metadata?: boolean
    event_type_id?: boolean
  }

  export type life_eventsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "person_id" | "event_id" | "title" | "start_date" | "end_date" | "location" | "description" | "metadata" | "event_type_id", ExtArgs["result"]["life_events"]>
  export type life_eventsInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    event?: boolean | life_events$eventArgs<ExtArgs>
    event_type?: boolean | life_events$event_typeArgs<ExtArgs>
    persons?: boolean | life_events$personsArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $life_eventsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "life_events"
    objects: {
      event: Prisma.$eventsPayload<ExtArgs> | null
      event_type: Prisma.$event_typesPayload<ExtArgs> | null
      persons: Prisma.$personsPayload<ExtArgs> | null
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      userId: number
      person_id: number | null
      event_id: number | null
      title: string | null
      start_date: Date | null
      end_date: Date | null
      location: string | null
      description: string | null
      metadata: Prisma.JsonValue | null
      event_type_id: number | null
    }, ExtArgs["result"]["life_events"]>
    composites: {}
  }

  type life_eventsGetPayload<S extends boolean | null | undefined | life_eventsDefaultArgs> = $Result.GetResult<Prisma.$life_eventsPayload, S>

  type life_eventsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<life_eventsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Life_eventsCountAggregateInputType | true
    }

  export interface life_eventsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['life_events'], meta: { name: 'life_events' } }
    /**
     * Find zero or one Life_events that matches the filter.
     * @param {life_eventsFindUniqueArgs} args - Arguments to find a Life_events
     * @example
     * // Get one Life_events
     * const life_events = await prisma.life_events.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends life_eventsFindUniqueArgs>(args: SelectSubset<T, life_eventsFindUniqueArgs<ExtArgs>>): Prisma__life_eventsClient<$Result.GetResult<Prisma.$life_eventsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Life_events that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {life_eventsFindUniqueOrThrowArgs} args - Arguments to find a Life_events
     * @example
     * // Get one Life_events
     * const life_events = await prisma.life_events.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends life_eventsFindUniqueOrThrowArgs>(args: SelectSubset<T, life_eventsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__life_eventsClient<$Result.GetResult<Prisma.$life_eventsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Life_events that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {life_eventsFindFirstArgs} args - Arguments to find a Life_events
     * @example
     * // Get one Life_events
     * const life_events = await prisma.life_events.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends life_eventsFindFirstArgs>(args?: SelectSubset<T, life_eventsFindFirstArgs<ExtArgs>>): Prisma__life_eventsClient<$Result.GetResult<Prisma.$life_eventsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Life_events that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {life_eventsFindFirstOrThrowArgs} args - Arguments to find a Life_events
     * @example
     * // Get one Life_events
     * const life_events = await prisma.life_events.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends life_eventsFindFirstOrThrowArgs>(args?: SelectSubset<T, life_eventsFindFirstOrThrowArgs<ExtArgs>>): Prisma__life_eventsClient<$Result.GetResult<Prisma.$life_eventsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Life_events that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {life_eventsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Life_events
     * const life_events = await prisma.life_events.findMany()
     * 
     * // Get first 10 Life_events
     * const life_events = await prisma.life_events.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const life_eventsWithIdOnly = await prisma.life_events.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends life_eventsFindManyArgs>(args?: SelectSubset<T, life_eventsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$life_eventsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Life_events.
     * @param {life_eventsCreateArgs} args - Arguments to create a Life_events.
     * @example
     * // Create one Life_events
     * const Life_events = await prisma.life_events.create({
     *   data: {
     *     // ... data to create a Life_events
     *   }
     * })
     * 
     */
    create<T extends life_eventsCreateArgs>(args: SelectSubset<T, life_eventsCreateArgs<ExtArgs>>): Prisma__life_eventsClient<$Result.GetResult<Prisma.$life_eventsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Life_events.
     * @param {life_eventsCreateManyArgs} args - Arguments to create many Life_events.
     * @example
     * // Create many Life_events
     * const life_events = await prisma.life_events.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends life_eventsCreateManyArgs>(args?: SelectSubset<T, life_eventsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Life_events.
     * @param {life_eventsDeleteArgs} args - Arguments to delete one Life_events.
     * @example
     * // Delete one Life_events
     * const Life_events = await prisma.life_events.delete({
     *   where: {
     *     // ... filter to delete one Life_events
     *   }
     * })
     * 
     */
    delete<T extends life_eventsDeleteArgs>(args: SelectSubset<T, life_eventsDeleteArgs<ExtArgs>>): Prisma__life_eventsClient<$Result.GetResult<Prisma.$life_eventsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Life_events.
     * @param {life_eventsUpdateArgs} args - Arguments to update one Life_events.
     * @example
     * // Update one Life_events
     * const life_events = await prisma.life_events.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends life_eventsUpdateArgs>(args: SelectSubset<T, life_eventsUpdateArgs<ExtArgs>>): Prisma__life_eventsClient<$Result.GetResult<Prisma.$life_eventsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Life_events.
     * @param {life_eventsDeleteManyArgs} args - Arguments to filter Life_events to delete.
     * @example
     * // Delete a few Life_events
     * const { count } = await prisma.life_events.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends life_eventsDeleteManyArgs>(args?: SelectSubset<T, life_eventsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Life_events.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {life_eventsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Life_events
     * const life_events = await prisma.life_events.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends life_eventsUpdateManyArgs>(args: SelectSubset<T, life_eventsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Life_events.
     * @param {life_eventsUpsertArgs} args - Arguments to update or create a Life_events.
     * @example
     * // Update or create a Life_events
     * const life_events = await prisma.life_events.upsert({
     *   create: {
     *     // ... data to create a Life_events
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Life_events we want to update
     *   }
     * })
     */
    upsert<T extends life_eventsUpsertArgs>(args: SelectSubset<T, life_eventsUpsertArgs<ExtArgs>>): Prisma__life_eventsClient<$Result.GetResult<Prisma.$life_eventsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Life_events.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {life_eventsCountArgs} args - Arguments to filter Life_events to count.
     * @example
     * // Count the number of Life_events
     * const count = await prisma.life_events.count({
     *   where: {
     *     // ... the filter for the Life_events we want to count
     *   }
     * })
    **/
    count<T extends life_eventsCountArgs>(
      args?: Subset<T, life_eventsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Life_eventsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Life_events.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Life_eventsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Life_eventsAggregateArgs>(args: Subset<T, Life_eventsAggregateArgs>): Prisma.PrismaPromise<GetLife_eventsAggregateType<T>>

    /**
     * Group by Life_events.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {life_eventsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends life_eventsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: life_eventsGroupByArgs['orderBy'] }
        : { orderBy?: life_eventsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, life_eventsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLife_eventsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the life_events model
   */
  readonly fields: life_eventsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for life_events.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__life_eventsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    event<T extends life_events$eventArgs<ExtArgs> = {}>(args?: Subset<T, life_events$eventArgs<ExtArgs>>): Prisma__eventsClient<$Result.GetResult<Prisma.$eventsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    event_type<T extends life_events$event_typeArgs<ExtArgs> = {}>(args?: Subset<T, life_events$event_typeArgs<ExtArgs>>): Prisma__event_typesClient<$Result.GetResult<Prisma.$event_typesPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    persons<T extends life_events$personsArgs<ExtArgs> = {}>(args?: Subset<T, life_events$personsArgs<ExtArgs>>): Prisma__personsClient<$Result.GetResult<Prisma.$personsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the life_events model
   */
  interface life_eventsFieldRefs {
    readonly id: FieldRef<"life_events", 'Int'>
    readonly userId: FieldRef<"life_events", 'Int'>
    readonly person_id: FieldRef<"life_events", 'Int'>
    readonly event_id: FieldRef<"life_events", 'Int'>
    readonly title: FieldRef<"life_events", 'String'>
    readonly start_date: FieldRef<"life_events", 'DateTime'>
    readonly end_date: FieldRef<"life_events", 'DateTime'>
    readonly location: FieldRef<"life_events", 'String'>
    readonly description: FieldRef<"life_events", 'String'>
    readonly metadata: FieldRef<"life_events", 'Json'>
    readonly event_type_id: FieldRef<"life_events", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * life_events findUnique
   */
  export type life_eventsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the life_events
     */
    select?: life_eventsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the life_events
     */
    omit?: life_eventsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: life_eventsInclude<ExtArgs> | null
    /**
     * Filter, which life_events to fetch.
     */
    where: life_eventsWhereUniqueInput
  }

  /**
   * life_events findUniqueOrThrow
   */
  export type life_eventsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the life_events
     */
    select?: life_eventsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the life_events
     */
    omit?: life_eventsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: life_eventsInclude<ExtArgs> | null
    /**
     * Filter, which life_events to fetch.
     */
    where: life_eventsWhereUniqueInput
  }

  /**
   * life_events findFirst
   */
  export type life_eventsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the life_events
     */
    select?: life_eventsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the life_events
     */
    omit?: life_eventsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: life_eventsInclude<ExtArgs> | null
    /**
     * Filter, which life_events to fetch.
     */
    where?: life_eventsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of life_events to fetch.
     */
    orderBy?: life_eventsOrderByWithRelationInput | life_eventsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for life_events.
     */
    cursor?: life_eventsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` life_events from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` life_events.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of life_events.
     */
    distinct?: Life_eventsScalarFieldEnum | Life_eventsScalarFieldEnum[]
  }

  /**
   * life_events findFirstOrThrow
   */
  export type life_eventsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the life_events
     */
    select?: life_eventsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the life_events
     */
    omit?: life_eventsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: life_eventsInclude<ExtArgs> | null
    /**
     * Filter, which life_events to fetch.
     */
    where?: life_eventsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of life_events to fetch.
     */
    orderBy?: life_eventsOrderByWithRelationInput | life_eventsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for life_events.
     */
    cursor?: life_eventsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` life_events from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` life_events.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of life_events.
     */
    distinct?: Life_eventsScalarFieldEnum | Life_eventsScalarFieldEnum[]
  }

  /**
   * life_events findMany
   */
  export type life_eventsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the life_events
     */
    select?: life_eventsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the life_events
     */
    omit?: life_eventsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: life_eventsInclude<ExtArgs> | null
    /**
     * Filter, which life_events to fetch.
     */
    where?: life_eventsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of life_events to fetch.
     */
    orderBy?: life_eventsOrderByWithRelationInput | life_eventsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing life_events.
     */
    cursor?: life_eventsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` life_events from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` life_events.
     */
    skip?: number
    distinct?: Life_eventsScalarFieldEnum | Life_eventsScalarFieldEnum[]
  }

  /**
   * life_events create
   */
  export type life_eventsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the life_events
     */
    select?: life_eventsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the life_events
     */
    omit?: life_eventsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: life_eventsInclude<ExtArgs> | null
    /**
     * The data needed to create a life_events.
     */
    data: XOR<life_eventsCreateInput, life_eventsUncheckedCreateInput>
  }

  /**
   * life_events createMany
   */
  export type life_eventsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many life_events.
     */
    data: life_eventsCreateManyInput | life_eventsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * life_events update
   */
  export type life_eventsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the life_events
     */
    select?: life_eventsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the life_events
     */
    omit?: life_eventsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: life_eventsInclude<ExtArgs> | null
    /**
     * The data needed to update a life_events.
     */
    data: XOR<life_eventsUpdateInput, life_eventsUncheckedUpdateInput>
    /**
     * Choose, which life_events to update.
     */
    where: life_eventsWhereUniqueInput
  }

  /**
   * life_events updateMany
   */
  export type life_eventsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update life_events.
     */
    data: XOR<life_eventsUpdateManyMutationInput, life_eventsUncheckedUpdateManyInput>
    /**
     * Filter which life_events to update
     */
    where?: life_eventsWhereInput
    /**
     * Limit how many life_events to update.
     */
    limit?: number
  }

  /**
   * life_events upsert
   */
  export type life_eventsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the life_events
     */
    select?: life_eventsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the life_events
     */
    omit?: life_eventsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: life_eventsInclude<ExtArgs> | null
    /**
     * The filter to search for the life_events to update in case it exists.
     */
    where: life_eventsWhereUniqueInput
    /**
     * In case the life_events found by the `where` argument doesn't exist, create a new life_events with this data.
     */
    create: XOR<life_eventsCreateInput, life_eventsUncheckedCreateInput>
    /**
     * In case the life_events was found with the provided `where` argument, update it with this data.
     */
    update: XOR<life_eventsUpdateInput, life_eventsUncheckedUpdateInput>
  }

  /**
   * life_events delete
   */
  export type life_eventsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the life_events
     */
    select?: life_eventsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the life_events
     */
    omit?: life_eventsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: life_eventsInclude<ExtArgs> | null
    /**
     * Filter which life_events to delete.
     */
    where: life_eventsWhereUniqueInput
  }

  /**
   * life_events deleteMany
   */
  export type life_eventsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which life_events to delete
     */
    where?: life_eventsWhereInput
    /**
     * Limit how many life_events to delete.
     */
    limit?: number
  }

  /**
   * life_events.event
   */
  export type life_events$eventArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the events
     */
    select?: eventsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the events
     */
    omit?: eventsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: eventsInclude<ExtArgs> | null
    where?: eventsWhereInput
  }

  /**
   * life_events.event_type
   */
  export type life_events$event_typeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the event_types
     */
    select?: event_typesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the event_types
     */
    omit?: event_typesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: event_typesInclude<ExtArgs> | null
    where?: event_typesWhereInput
  }

  /**
   * life_events.persons
   */
  export type life_events$personsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the persons
     */
    select?: personsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the persons
     */
    omit?: personsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: personsInclude<ExtArgs> | null
    where?: personsWhereInput
  }

  /**
   * life_events without action
   */
  export type life_eventsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the life_events
     */
    select?: life_eventsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the life_events
     */
    omit?: life_eventsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: life_eventsInclude<ExtArgs> | null
  }


  /**
   * Model persons
   */

  export type AggregatePersons = {
    _count: PersonsCountAggregateOutputType | null
    _avg: PersonsAvgAggregateOutputType | null
    _sum: PersonsSumAggregateOutputType | null
    _min: PersonsMinAggregateOutputType | null
    _max: PersonsMaxAggregateOutputType | null
  }

  export type PersonsAvgAggregateOutputType = {
    id: number | null
    userId: number | null
  }

  export type PersonsSumAggregateOutputType = {
    id: number | null
    userId: number | null
  }

  export type PersonsMinAggregateOutputType = {
    id: number | null
    userId: number | null
    first_name: string | null
    last_name: string | null
    birth_date: Date | null
    birth_place: string | null
    death_date: Date | null
    death_place: string | null
    notes: string | null
  }

  export type PersonsMaxAggregateOutputType = {
    id: number | null
    userId: number | null
    first_name: string | null
    last_name: string | null
    birth_date: Date | null
    birth_place: string | null
    death_date: Date | null
    death_place: string | null
    notes: string | null
  }

  export type PersonsCountAggregateOutputType = {
    id: number
    userId: number
    first_name: number
    last_name: number
    birth_date: number
    birth_place: number
    death_date: number
    death_place: number
    notes: number
    _all: number
  }


  export type PersonsAvgAggregateInputType = {
    id?: true
    userId?: true
  }

  export type PersonsSumAggregateInputType = {
    id?: true
    userId?: true
  }

  export type PersonsMinAggregateInputType = {
    id?: true
    userId?: true
    first_name?: true
    last_name?: true
    birth_date?: true
    birth_place?: true
    death_date?: true
    death_place?: true
    notes?: true
  }

  export type PersonsMaxAggregateInputType = {
    id?: true
    userId?: true
    first_name?: true
    last_name?: true
    birth_date?: true
    birth_place?: true
    death_date?: true
    death_place?: true
    notes?: true
  }

  export type PersonsCountAggregateInputType = {
    id?: true
    userId?: true
    first_name?: true
    last_name?: true
    birth_date?: true
    birth_place?: true
    death_date?: true
    death_place?: true
    notes?: true
    _all?: true
  }

  export type PersonsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which persons to aggregate.
     */
    where?: personsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of persons to fetch.
     */
    orderBy?: personsOrderByWithRelationInput | personsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: personsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` persons from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` persons.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned persons
    **/
    _count?: true | PersonsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PersonsAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PersonsSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PersonsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PersonsMaxAggregateInputType
  }

  export type GetPersonsAggregateType<T extends PersonsAggregateArgs> = {
        [P in keyof T & keyof AggregatePersons]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePersons[P]>
      : GetScalarType<T[P], AggregatePersons[P]>
  }




  export type personsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: personsWhereInput
    orderBy?: personsOrderByWithAggregationInput | personsOrderByWithAggregationInput[]
    by: PersonsScalarFieldEnum[] | PersonsScalarFieldEnum
    having?: personsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PersonsCountAggregateInputType | true
    _avg?: PersonsAvgAggregateInputType
    _sum?: PersonsSumAggregateInputType
    _min?: PersonsMinAggregateInputType
    _max?: PersonsMaxAggregateInputType
  }

  export type PersonsGroupByOutputType = {
    id: number
    userId: number
    first_name: string | null
    last_name: string | null
    birth_date: Date | null
    birth_place: string | null
    death_date: Date | null
    death_place: string | null
    notes: string | null
    _count: PersonsCountAggregateOutputType | null
    _avg: PersonsAvgAggregateOutputType | null
    _sum: PersonsSumAggregateOutputType | null
    _min: PersonsMinAggregateOutputType | null
    _max: PersonsMaxAggregateOutputType | null
  }

  type GetPersonsGroupByPayload<T extends personsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PersonsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PersonsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PersonsGroupByOutputType[P]>
            : GetScalarType<T[P], PersonsGroupByOutputType[P]>
        }
      >
    >


  export type personsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    first_name?: boolean
    last_name?: boolean
    birth_date?: boolean
    birth_place?: boolean
    death_date?: boolean
    death_place?: boolean
    notes?: boolean
    life_events?: boolean | persons$life_eventsArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
    relations_from?: boolean | persons$relations_fromArgs<ExtArgs>
    relations_to?: boolean | persons$relations_toArgs<ExtArgs>
    _count?: boolean | PersonsCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["persons"]>



  export type personsSelectScalar = {
    id?: boolean
    userId?: boolean
    first_name?: boolean
    last_name?: boolean
    birth_date?: boolean
    birth_place?: boolean
    death_date?: boolean
    death_place?: boolean
    notes?: boolean
  }

  export type personsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "first_name" | "last_name" | "birth_date" | "birth_place" | "death_date" | "death_place" | "notes", ExtArgs["result"]["persons"]>
  export type personsInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    life_events?: boolean | persons$life_eventsArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
    relations_from?: boolean | persons$relations_fromArgs<ExtArgs>
    relations_to?: boolean | persons$relations_toArgs<ExtArgs>
    _count?: boolean | PersonsCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $personsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "persons"
    objects: {
      life_events: Prisma.$life_eventsPayload<ExtArgs>[]
      user: Prisma.$UserPayload<ExtArgs>
      relations_from: Prisma.$person_relationsPayload<ExtArgs>[]
      relations_to: Prisma.$person_relationsPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      userId: number
      first_name: string | null
      last_name: string | null
      birth_date: Date | null
      birth_place: string | null
      death_date: Date | null
      death_place: string | null
      notes: string | null
    }, ExtArgs["result"]["persons"]>
    composites: {}
  }

  type personsGetPayload<S extends boolean | null | undefined | personsDefaultArgs> = $Result.GetResult<Prisma.$personsPayload, S>

  type personsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<personsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PersonsCountAggregateInputType | true
    }

  export interface personsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['persons'], meta: { name: 'persons' } }
    /**
     * Find zero or one Persons that matches the filter.
     * @param {personsFindUniqueArgs} args - Arguments to find a Persons
     * @example
     * // Get one Persons
     * const persons = await prisma.persons.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends personsFindUniqueArgs>(args: SelectSubset<T, personsFindUniqueArgs<ExtArgs>>): Prisma__personsClient<$Result.GetResult<Prisma.$personsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Persons that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {personsFindUniqueOrThrowArgs} args - Arguments to find a Persons
     * @example
     * // Get one Persons
     * const persons = await prisma.persons.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends personsFindUniqueOrThrowArgs>(args: SelectSubset<T, personsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__personsClient<$Result.GetResult<Prisma.$personsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Persons that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {personsFindFirstArgs} args - Arguments to find a Persons
     * @example
     * // Get one Persons
     * const persons = await prisma.persons.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends personsFindFirstArgs>(args?: SelectSubset<T, personsFindFirstArgs<ExtArgs>>): Prisma__personsClient<$Result.GetResult<Prisma.$personsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Persons that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {personsFindFirstOrThrowArgs} args - Arguments to find a Persons
     * @example
     * // Get one Persons
     * const persons = await prisma.persons.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends personsFindFirstOrThrowArgs>(args?: SelectSubset<T, personsFindFirstOrThrowArgs<ExtArgs>>): Prisma__personsClient<$Result.GetResult<Prisma.$personsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Persons that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {personsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Persons
     * const persons = await prisma.persons.findMany()
     * 
     * // Get first 10 Persons
     * const persons = await prisma.persons.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const personsWithIdOnly = await prisma.persons.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends personsFindManyArgs>(args?: SelectSubset<T, personsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$personsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Persons.
     * @param {personsCreateArgs} args - Arguments to create a Persons.
     * @example
     * // Create one Persons
     * const Persons = await prisma.persons.create({
     *   data: {
     *     // ... data to create a Persons
     *   }
     * })
     * 
     */
    create<T extends personsCreateArgs>(args: SelectSubset<T, personsCreateArgs<ExtArgs>>): Prisma__personsClient<$Result.GetResult<Prisma.$personsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Persons.
     * @param {personsCreateManyArgs} args - Arguments to create many Persons.
     * @example
     * // Create many Persons
     * const persons = await prisma.persons.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends personsCreateManyArgs>(args?: SelectSubset<T, personsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Persons.
     * @param {personsDeleteArgs} args - Arguments to delete one Persons.
     * @example
     * // Delete one Persons
     * const Persons = await prisma.persons.delete({
     *   where: {
     *     // ... filter to delete one Persons
     *   }
     * })
     * 
     */
    delete<T extends personsDeleteArgs>(args: SelectSubset<T, personsDeleteArgs<ExtArgs>>): Prisma__personsClient<$Result.GetResult<Prisma.$personsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Persons.
     * @param {personsUpdateArgs} args - Arguments to update one Persons.
     * @example
     * // Update one Persons
     * const persons = await prisma.persons.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends personsUpdateArgs>(args: SelectSubset<T, personsUpdateArgs<ExtArgs>>): Prisma__personsClient<$Result.GetResult<Prisma.$personsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Persons.
     * @param {personsDeleteManyArgs} args - Arguments to filter Persons to delete.
     * @example
     * // Delete a few Persons
     * const { count } = await prisma.persons.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends personsDeleteManyArgs>(args?: SelectSubset<T, personsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Persons.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {personsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Persons
     * const persons = await prisma.persons.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends personsUpdateManyArgs>(args: SelectSubset<T, personsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Persons.
     * @param {personsUpsertArgs} args - Arguments to update or create a Persons.
     * @example
     * // Update or create a Persons
     * const persons = await prisma.persons.upsert({
     *   create: {
     *     // ... data to create a Persons
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Persons we want to update
     *   }
     * })
     */
    upsert<T extends personsUpsertArgs>(args: SelectSubset<T, personsUpsertArgs<ExtArgs>>): Prisma__personsClient<$Result.GetResult<Prisma.$personsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Persons.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {personsCountArgs} args - Arguments to filter Persons to count.
     * @example
     * // Count the number of Persons
     * const count = await prisma.persons.count({
     *   where: {
     *     // ... the filter for the Persons we want to count
     *   }
     * })
    **/
    count<T extends personsCountArgs>(
      args?: Subset<T, personsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PersonsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Persons.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PersonsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PersonsAggregateArgs>(args: Subset<T, PersonsAggregateArgs>): Prisma.PrismaPromise<GetPersonsAggregateType<T>>

    /**
     * Group by Persons.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {personsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends personsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: personsGroupByArgs['orderBy'] }
        : { orderBy?: personsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, personsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPersonsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the persons model
   */
  readonly fields: personsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for persons.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__personsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    life_events<T extends persons$life_eventsArgs<ExtArgs> = {}>(args?: Subset<T, persons$life_eventsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$life_eventsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    relations_from<T extends persons$relations_fromArgs<ExtArgs> = {}>(args?: Subset<T, persons$relations_fromArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$person_relationsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    relations_to<T extends persons$relations_toArgs<ExtArgs> = {}>(args?: Subset<T, persons$relations_toArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$person_relationsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the persons model
   */
  interface personsFieldRefs {
    readonly id: FieldRef<"persons", 'Int'>
    readonly userId: FieldRef<"persons", 'Int'>
    readonly first_name: FieldRef<"persons", 'String'>
    readonly last_name: FieldRef<"persons", 'String'>
    readonly birth_date: FieldRef<"persons", 'DateTime'>
    readonly birth_place: FieldRef<"persons", 'String'>
    readonly death_date: FieldRef<"persons", 'DateTime'>
    readonly death_place: FieldRef<"persons", 'String'>
    readonly notes: FieldRef<"persons", 'String'>
  }
    

  // Custom InputTypes
  /**
   * persons findUnique
   */
  export type personsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the persons
     */
    select?: personsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the persons
     */
    omit?: personsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: personsInclude<ExtArgs> | null
    /**
     * Filter, which persons to fetch.
     */
    where: personsWhereUniqueInput
  }

  /**
   * persons findUniqueOrThrow
   */
  export type personsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the persons
     */
    select?: personsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the persons
     */
    omit?: personsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: personsInclude<ExtArgs> | null
    /**
     * Filter, which persons to fetch.
     */
    where: personsWhereUniqueInput
  }

  /**
   * persons findFirst
   */
  export type personsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the persons
     */
    select?: personsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the persons
     */
    omit?: personsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: personsInclude<ExtArgs> | null
    /**
     * Filter, which persons to fetch.
     */
    where?: personsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of persons to fetch.
     */
    orderBy?: personsOrderByWithRelationInput | personsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for persons.
     */
    cursor?: personsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` persons from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` persons.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of persons.
     */
    distinct?: PersonsScalarFieldEnum | PersonsScalarFieldEnum[]
  }

  /**
   * persons findFirstOrThrow
   */
  export type personsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the persons
     */
    select?: personsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the persons
     */
    omit?: personsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: personsInclude<ExtArgs> | null
    /**
     * Filter, which persons to fetch.
     */
    where?: personsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of persons to fetch.
     */
    orderBy?: personsOrderByWithRelationInput | personsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for persons.
     */
    cursor?: personsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` persons from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` persons.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of persons.
     */
    distinct?: PersonsScalarFieldEnum | PersonsScalarFieldEnum[]
  }

  /**
   * persons findMany
   */
  export type personsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the persons
     */
    select?: personsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the persons
     */
    omit?: personsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: personsInclude<ExtArgs> | null
    /**
     * Filter, which persons to fetch.
     */
    where?: personsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of persons to fetch.
     */
    orderBy?: personsOrderByWithRelationInput | personsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing persons.
     */
    cursor?: personsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` persons from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` persons.
     */
    skip?: number
    distinct?: PersonsScalarFieldEnum | PersonsScalarFieldEnum[]
  }

  /**
   * persons create
   */
  export type personsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the persons
     */
    select?: personsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the persons
     */
    omit?: personsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: personsInclude<ExtArgs> | null
    /**
     * The data needed to create a persons.
     */
    data: XOR<personsCreateInput, personsUncheckedCreateInput>
  }

  /**
   * persons createMany
   */
  export type personsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many persons.
     */
    data: personsCreateManyInput | personsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * persons update
   */
  export type personsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the persons
     */
    select?: personsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the persons
     */
    omit?: personsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: personsInclude<ExtArgs> | null
    /**
     * The data needed to update a persons.
     */
    data: XOR<personsUpdateInput, personsUncheckedUpdateInput>
    /**
     * Choose, which persons to update.
     */
    where: personsWhereUniqueInput
  }

  /**
   * persons updateMany
   */
  export type personsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update persons.
     */
    data: XOR<personsUpdateManyMutationInput, personsUncheckedUpdateManyInput>
    /**
     * Filter which persons to update
     */
    where?: personsWhereInput
    /**
     * Limit how many persons to update.
     */
    limit?: number
  }

  /**
   * persons upsert
   */
  export type personsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the persons
     */
    select?: personsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the persons
     */
    omit?: personsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: personsInclude<ExtArgs> | null
    /**
     * The filter to search for the persons to update in case it exists.
     */
    where: personsWhereUniqueInput
    /**
     * In case the persons found by the `where` argument doesn't exist, create a new persons with this data.
     */
    create: XOR<personsCreateInput, personsUncheckedCreateInput>
    /**
     * In case the persons was found with the provided `where` argument, update it with this data.
     */
    update: XOR<personsUpdateInput, personsUncheckedUpdateInput>
  }

  /**
   * persons delete
   */
  export type personsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the persons
     */
    select?: personsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the persons
     */
    omit?: personsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: personsInclude<ExtArgs> | null
    /**
     * Filter which persons to delete.
     */
    where: personsWhereUniqueInput
  }

  /**
   * persons deleteMany
   */
  export type personsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which persons to delete
     */
    where?: personsWhereInput
    /**
     * Limit how many persons to delete.
     */
    limit?: number
  }

  /**
   * persons.life_events
   */
  export type persons$life_eventsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the life_events
     */
    select?: life_eventsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the life_events
     */
    omit?: life_eventsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: life_eventsInclude<ExtArgs> | null
    where?: life_eventsWhereInput
    orderBy?: life_eventsOrderByWithRelationInput | life_eventsOrderByWithRelationInput[]
    cursor?: life_eventsWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Life_eventsScalarFieldEnum | Life_eventsScalarFieldEnum[]
  }

  /**
   * persons.relations_from
   */
  export type persons$relations_fromArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the person_relations
     */
    select?: person_relationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the person_relations
     */
    omit?: person_relationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: person_relationsInclude<ExtArgs> | null
    where?: person_relationsWhereInput
    orderBy?: person_relationsOrderByWithRelationInput | person_relationsOrderByWithRelationInput[]
    cursor?: person_relationsWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Person_relationsScalarFieldEnum | Person_relationsScalarFieldEnum[]
  }

  /**
   * persons.relations_to
   */
  export type persons$relations_toArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the person_relations
     */
    select?: person_relationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the person_relations
     */
    omit?: person_relationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: person_relationsInclude<ExtArgs> | null
    where?: person_relationsWhereInput
    orderBy?: person_relationsOrderByWithRelationInput | person_relationsOrderByWithRelationInput[]
    cursor?: person_relationsWhereUniqueInput
    take?: number
    skip?: number
    distinct?: Person_relationsScalarFieldEnum | Person_relationsScalarFieldEnum[]
  }

  /**
   * persons without action
   */
  export type personsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the persons
     */
    select?: personsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the persons
     */
    omit?: personsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: personsInclude<ExtArgs> | null
  }


  /**
   * Model person_relations
   */

  export type AggregatePerson_relations = {
    _count: Person_relationsCountAggregateOutputType | null
    _avg: Person_relationsAvgAggregateOutputType | null
    _sum: Person_relationsSumAggregateOutputType | null
    _min: Person_relationsMinAggregateOutputType | null
    _max: Person_relationsMaxAggregateOutputType | null
  }

  export type Person_relationsAvgAggregateOutputType = {
    id: number | null
    from_person_id: number | null
    to_person_id: number | null
  }

  export type Person_relationsSumAggregateOutputType = {
    id: number | null
    from_person_id: number | null
    to_person_id: number | null
  }

  export type Person_relationsMinAggregateOutputType = {
    id: number | null
    from_person_id: number | null
    to_person_id: number | null
    relation_type: string | null
    notes: string | null
  }

  export type Person_relationsMaxAggregateOutputType = {
    id: number | null
    from_person_id: number | null
    to_person_id: number | null
    relation_type: string | null
    notes: string | null
  }

  export type Person_relationsCountAggregateOutputType = {
    id: number
    from_person_id: number
    to_person_id: number
    relation_type: number
    notes: number
    _all: number
  }


  export type Person_relationsAvgAggregateInputType = {
    id?: true
    from_person_id?: true
    to_person_id?: true
  }

  export type Person_relationsSumAggregateInputType = {
    id?: true
    from_person_id?: true
    to_person_id?: true
  }

  export type Person_relationsMinAggregateInputType = {
    id?: true
    from_person_id?: true
    to_person_id?: true
    relation_type?: true
    notes?: true
  }

  export type Person_relationsMaxAggregateInputType = {
    id?: true
    from_person_id?: true
    to_person_id?: true
    relation_type?: true
    notes?: true
  }

  export type Person_relationsCountAggregateInputType = {
    id?: true
    from_person_id?: true
    to_person_id?: true
    relation_type?: true
    notes?: true
    _all?: true
  }

  export type Person_relationsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which person_relations to aggregate.
     */
    where?: person_relationsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of person_relations to fetch.
     */
    orderBy?: person_relationsOrderByWithRelationInput | person_relationsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: person_relationsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` person_relations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` person_relations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned person_relations
    **/
    _count?: true | Person_relationsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: Person_relationsAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: Person_relationsSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: Person_relationsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: Person_relationsMaxAggregateInputType
  }

  export type GetPerson_relationsAggregateType<T extends Person_relationsAggregateArgs> = {
        [P in keyof T & keyof AggregatePerson_relations]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePerson_relations[P]>
      : GetScalarType<T[P], AggregatePerson_relations[P]>
  }




  export type person_relationsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: person_relationsWhereInput
    orderBy?: person_relationsOrderByWithAggregationInput | person_relationsOrderByWithAggregationInput[]
    by: Person_relationsScalarFieldEnum[] | Person_relationsScalarFieldEnum
    having?: person_relationsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: Person_relationsCountAggregateInputType | true
    _avg?: Person_relationsAvgAggregateInputType
    _sum?: Person_relationsSumAggregateInputType
    _min?: Person_relationsMinAggregateInputType
    _max?: Person_relationsMaxAggregateInputType
  }

  export type Person_relationsGroupByOutputType = {
    id: number
    from_person_id: number
    to_person_id: number
    relation_type: string
    notes: string | null
    _count: Person_relationsCountAggregateOutputType | null
    _avg: Person_relationsAvgAggregateOutputType | null
    _sum: Person_relationsSumAggregateOutputType | null
    _min: Person_relationsMinAggregateOutputType | null
    _max: Person_relationsMaxAggregateOutputType | null
  }

  type GetPerson_relationsGroupByPayload<T extends person_relationsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<Person_relationsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof Person_relationsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], Person_relationsGroupByOutputType[P]>
            : GetScalarType<T[P], Person_relationsGroupByOutputType[P]>
        }
      >
    >


  export type person_relationsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    from_person_id?: boolean
    to_person_id?: boolean
    relation_type?: boolean
    notes?: boolean
    from_person?: boolean | personsDefaultArgs<ExtArgs>
    to_person?: boolean | personsDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["person_relations"]>



  export type person_relationsSelectScalar = {
    id?: boolean
    from_person_id?: boolean
    to_person_id?: boolean
    relation_type?: boolean
    notes?: boolean
  }

  export type person_relationsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "from_person_id" | "to_person_id" | "relation_type" | "notes", ExtArgs["result"]["person_relations"]>
  export type person_relationsInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    from_person?: boolean | personsDefaultArgs<ExtArgs>
    to_person?: boolean | personsDefaultArgs<ExtArgs>
  }

  export type $person_relationsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "person_relations"
    objects: {
      from_person: Prisma.$personsPayload<ExtArgs>
      to_person: Prisma.$personsPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      from_person_id: number
      to_person_id: number
      relation_type: string
      notes: string | null
    }, ExtArgs["result"]["person_relations"]>
    composites: {}
  }

  type person_relationsGetPayload<S extends boolean | null | undefined | person_relationsDefaultArgs> = $Result.GetResult<Prisma.$person_relationsPayload, S>

  type person_relationsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<person_relationsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: Person_relationsCountAggregateInputType | true
    }

  export interface person_relationsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['person_relations'], meta: { name: 'person_relations' } }
    /**
     * Find zero or one Person_relations that matches the filter.
     * @param {person_relationsFindUniqueArgs} args - Arguments to find a Person_relations
     * @example
     * // Get one Person_relations
     * const person_relations = await prisma.person_relations.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends person_relationsFindUniqueArgs>(args: SelectSubset<T, person_relationsFindUniqueArgs<ExtArgs>>): Prisma__person_relationsClient<$Result.GetResult<Prisma.$person_relationsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Person_relations that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {person_relationsFindUniqueOrThrowArgs} args - Arguments to find a Person_relations
     * @example
     * // Get one Person_relations
     * const person_relations = await prisma.person_relations.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends person_relationsFindUniqueOrThrowArgs>(args: SelectSubset<T, person_relationsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__person_relationsClient<$Result.GetResult<Prisma.$person_relationsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Person_relations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {person_relationsFindFirstArgs} args - Arguments to find a Person_relations
     * @example
     * // Get one Person_relations
     * const person_relations = await prisma.person_relations.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends person_relationsFindFirstArgs>(args?: SelectSubset<T, person_relationsFindFirstArgs<ExtArgs>>): Prisma__person_relationsClient<$Result.GetResult<Prisma.$person_relationsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Person_relations that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {person_relationsFindFirstOrThrowArgs} args - Arguments to find a Person_relations
     * @example
     * // Get one Person_relations
     * const person_relations = await prisma.person_relations.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends person_relationsFindFirstOrThrowArgs>(args?: SelectSubset<T, person_relationsFindFirstOrThrowArgs<ExtArgs>>): Prisma__person_relationsClient<$Result.GetResult<Prisma.$person_relationsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Person_relations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {person_relationsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Person_relations
     * const person_relations = await prisma.person_relations.findMany()
     * 
     * // Get first 10 Person_relations
     * const person_relations = await prisma.person_relations.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const person_relationsWithIdOnly = await prisma.person_relations.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends person_relationsFindManyArgs>(args?: SelectSubset<T, person_relationsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$person_relationsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Person_relations.
     * @param {person_relationsCreateArgs} args - Arguments to create a Person_relations.
     * @example
     * // Create one Person_relations
     * const Person_relations = await prisma.person_relations.create({
     *   data: {
     *     // ... data to create a Person_relations
     *   }
     * })
     * 
     */
    create<T extends person_relationsCreateArgs>(args: SelectSubset<T, person_relationsCreateArgs<ExtArgs>>): Prisma__person_relationsClient<$Result.GetResult<Prisma.$person_relationsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Person_relations.
     * @param {person_relationsCreateManyArgs} args - Arguments to create many Person_relations.
     * @example
     * // Create many Person_relations
     * const person_relations = await prisma.person_relations.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends person_relationsCreateManyArgs>(args?: SelectSubset<T, person_relationsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Person_relations.
     * @param {person_relationsDeleteArgs} args - Arguments to delete one Person_relations.
     * @example
     * // Delete one Person_relations
     * const Person_relations = await prisma.person_relations.delete({
     *   where: {
     *     // ... filter to delete one Person_relations
     *   }
     * })
     * 
     */
    delete<T extends person_relationsDeleteArgs>(args: SelectSubset<T, person_relationsDeleteArgs<ExtArgs>>): Prisma__person_relationsClient<$Result.GetResult<Prisma.$person_relationsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Person_relations.
     * @param {person_relationsUpdateArgs} args - Arguments to update one Person_relations.
     * @example
     * // Update one Person_relations
     * const person_relations = await prisma.person_relations.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends person_relationsUpdateArgs>(args: SelectSubset<T, person_relationsUpdateArgs<ExtArgs>>): Prisma__person_relationsClient<$Result.GetResult<Prisma.$person_relationsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Person_relations.
     * @param {person_relationsDeleteManyArgs} args - Arguments to filter Person_relations to delete.
     * @example
     * // Delete a few Person_relations
     * const { count } = await prisma.person_relations.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends person_relationsDeleteManyArgs>(args?: SelectSubset<T, person_relationsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Person_relations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {person_relationsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Person_relations
     * const person_relations = await prisma.person_relations.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends person_relationsUpdateManyArgs>(args: SelectSubset<T, person_relationsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Person_relations.
     * @param {person_relationsUpsertArgs} args - Arguments to update or create a Person_relations.
     * @example
     * // Update or create a Person_relations
     * const person_relations = await prisma.person_relations.upsert({
     *   create: {
     *     // ... data to create a Person_relations
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Person_relations we want to update
     *   }
     * })
     */
    upsert<T extends person_relationsUpsertArgs>(args: SelectSubset<T, person_relationsUpsertArgs<ExtArgs>>): Prisma__person_relationsClient<$Result.GetResult<Prisma.$person_relationsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Person_relations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {person_relationsCountArgs} args - Arguments to filter Person_relations to count.
     * @example
     * // Count the number of Person_relations
     * const count = await prisma.person_relations.count({
     *   where: {
     *     // ... the filter for the Person_relations we want to count
     *   }
     * })
    **/
    count<T extends person_relationsCountArgs>(
      args?: Subset<T, person_relationsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], Person_relationsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Person_relations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {Person_relationsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends Person_relationsAggregateArgs>(args: Subset<T, Person_relationsAggregateArgs>): Prisma.PrismaPromise<GetPerson_relationsAggregateType<T>>

    /**
     * Group by Person_relations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {person_relationsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends person_relationsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: person_relationsGroupByArgs['orderBy'] }
        : { orderBy?: person_relationsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, person_relationsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPerson_relationsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the person_relations model
   */
  readonly fields: person_relationsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for person_relations.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__person_relationsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    from_person<T extends personsDefaultArgs<ExtArgs> = {}>(args?: Subset<T, personsDefaultArgs<ExtArgs>>): Prisma__personsClient<$Result.GetResult<Prisma.$personsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    to_person<T extends personsDefaultArgs<ExtArgs> = {}>(args?: Subset<T, personsDefaultArgs<ExtArgs>>): Prisma__personsClient<$Result.GetResult<Prisma.$personsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the person_relations model
   */
  interface person_relationsFieldRefs {
    readonly id: FieldRef<"person_relations", 'Int'>
    readonly from_person_id: FieldRef<"person_relations", 'Int'>
    readonly to_person_id: FieldRef<"person_relations", 'Int'>
    readonly relation_type: FieldRef<"person_relations", 'String'>
    readonly notes: FieldRef<"person_relations", 'String'>
  }
    

  // Custom InputTypes
  /**
   * person_relations findUnique
   */
  export type person_relationsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the person_relations
     */
    select?: person_relationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the person_relations
     */
    omit?: person_relationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: person_relationsInclude<ExtArgs> | null
    /**
     * Filter, which person_relations to fetch.
     */
    where: person_relationsWhereUniqueInput
  }

  /**
   * person_relations findUniqueOrThrow
   */
  export type person_relationsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the person_relations
     */
    select?: person_relationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the person_relations
     */
    omit?: person_relationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: person_relationsInclude<ExtArgs> | null
    /**
     * Filter, which person_relations to fetch.
     */
    where: person_relationsWhereUniqueInput
  }

  /**
   * person_relations findFirst
   */
  export type person_relationsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the person_relations
     */
    select?: person_relationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the person_relations
     */
    omit?: person_relationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: person_relationsInclude<ExtArgs> | null
    /**
     * Filter, which person_relations to fetch.
     */
    where?: person_relationsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of person_relations to fetch.
     */
    orderBy?: person_relationsOrderByWithRelationInput | person_relationsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for person_relations.
     */
    cursor?: person_relationsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` person_relations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` person_relations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of person_relations.
     */
    distinct?: Person_relationsScalarFieldEnum | Person_relationsScalarFieldEnum[]
  }

  /**
   * person_relations findFirstOrThrow
   */
  export type person_relationsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the person_relations
     */
    select?: person_relationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the person_relations
     */
    omit?: person_relationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: person_relationsInclude<ExtArgs> | null
    /**
     * Filter, which person_relations to fetch.
     */
    where?: person_relationsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of person_relations to fetch.
     */
    orderBy?: person_relationsOrderByWithRelationInput | person_relationsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for person_relations.
     */
    cursor?: person_relationsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` person_relations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` person_relations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of person_relations.
     */
    distinct?: Person_relationsScalarFieldEnum | Person_relationsScalarFieldEnum[]
  }

  /**
   * person_relations findMany
   */
  export type person_relationsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the person_relations
     */
    select?: person_relationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the person_relations
     */
    omit?: person_relationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: person_relationsInclude<ExtArgs> | null
    /**
     * Filter, which person_relations to fetch.
     */
    where?: person_relationsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of person_relations to fetch.
     */
    orderBy?: person_relationsOrderByWithRelationInput | person_relationsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing person_relations.
     */
    cursor?: person_relationsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` person_relations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` person_relations.
     */
    skip?: number
    distinct?: Person_relationsScalarFieldEnum | Person_relationsScalarFieldEnum[]
  }

  /**
   * person_relations create
   */
  export type person_relationsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the person_relations
     */
    select?: person_relationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the person_relations
     */
    omit?: person_relationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: person_relationsInclude<ExtArgs> | null
    /**
     * The data needed to create a person_relations.
     */
    data: XOR<person_relationsCreateInput, person_relationsUncheckedCreateInput>
  }

  /**
   * person_relations createMany
   */
  export type person_relationsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many person_relations.
     */
    data: person_relationsCreateManyInput | person_relationsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * person_relations update
   */
  export type person_relationsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the person_relations
     */
    select?: person_relationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the person_relations
     */
    omit?: person_relationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: person_relationsInclude<ExtArgs> | null
    /**
     * The data needed to update a person_relations.
     */
    data: XOR<person_relationsUpdateInput, person_relationsUncheckedUpdateInput>
    /**
     * Choose, which person_relations to update.
     */
    where: person_relationsWhereUniqueInput
  }

  /**
   * person_relations updateMany
   */
  export type person_relationsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update person_relations.
     */
    data: XOR<person_relationsUpdateManyMutationInput, person_relationsUncheckedUpdateManyInput>
    /**
     * Filter which person_relations to update
     */
    where?: person_relationsWhereInput
    /**
     * Limit how many person_relations to update.
     */
    limit?: number
  }

  /**
   * person_relations upsert
   */
  export type person_relationsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the person_relations
     */
    select?: person_relationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the person_relations
     */
    omit?: person_relationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: person_relationsInclude<ExtArgs> | null
    /**
     * The filter to search for the person_relations to update in case it exists.
     */
    where: person_relationsWhereUniqueInput
    /**
     * In case the person_relations found by the `where` argument doesn't exist, create a new person_relations with this data.
     */
    create: XOR<person_relationsCreateInput, person_relationsUncheckedCreateInput>
    /**
     * In case the person_relations was found with the provided `where` argument, update it with this data.
     */
    update: XOR<person_relationsUpdateInput, person_relationsUncheckedUpdateInput>
  }

  /**
   * person_relations delete
   */
  export type person_relationsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the person_relations
     */
    select?: person_relationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the person_relations
     */
    omit?: person_relationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: person_relationsInclude<ExtArgs> | null
    /**
     * Filter which person_relations to delete.
     */
    where: person_relationsWhereUniqueInput
  }

  /**
   * person_relations deleteMany
   */
  export type person_relationsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which person_relations to delete
     */
    where?: person_relationsWhereInput
    /**
     * Limit how many person_relations to delete.
     */
    limit?: number
  }

  /**
   * person_relations without action
   */
  export type person_relationsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the person_relations
     */
    select?: person_relationsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the person_relations
     */
    omit?: person_relationsOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: person_relationsInclude<ExtArgs> | null
  }


  /**
   * Model literature
   */

  export type AggregateLiterature = {
    _count: LiteratureCountAggregateOutputType | null
    _avg: LiteratureAvgAggregateOutputType | null
    _sum: LiteratureSumAggregateOutputType | null
    _min: LiteratureMinAggregateOutputType | null
    _max: LiteratureMaxAggregateOutputType | null
  }

  export type LiteratureAvgAggregateOutputType = {
    id: number | null
    userId: number | null
    publicationYear: number | null
  }

  export type LiteratureSumAggregateOutputType = {
    id: number | null
    userId: number | null
    publicationYear: number | null
  }

  export type LiteratureMinAggregateOutputType = {
    id: number | null
    userId: number | null
    title: string | null
    author: string | null
    publicationYear: number | null
    type: string | null
    description: string | null
    url: string | null
    publisher: string | null
    journal: string | null
    volume: string | null
    issue: string | null
    pages: string | null
    doi: string | null
    isbn: string | null
    issn: string | null
    language: string | null
    keywords: string | null
    abstract: string | null
    externalId: string | null
    syncSource: string | null
    lastSyncedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LiteratureMaxAggregateOutputType = {
    id: number | null
    userId: number | null
    title: string | null
    author: string | null
    publicationYear: number | null
    type: string | null
    description: string | null
    url: string | null
    publisher: string | null
    journal: string | null
    volume: string | null
    issue: string | null
    pages: string | null
    doi: string | null
    isbn: string | null
    issn: string | null
    language: string | null
    keywords: string | null
    abstract: string | null
    externalId: string | null
    syncSource: string | null
    lastSyncedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LiteratureCountAggregateOutputType = {
    id: number
    userId: number
    title: number
    author: number
    publicationYear: number
    type: number
    description: number
    url: number
    publisher: number
    journal: number
    volume: number
    issue: number
    pages: number
    doi: number
    isbn: number
    issn: number
    language: number
    keywords: number
    abstract: number
    externalId: number
    syncSource: number
    lastSyncedAt: number
    syncMetadata: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type LiteratureAvgAggregateInputType = {
    id?: true
    userId?: true
    publicationYear?: true
  }

  export type LiteratureSumAggregateInputType = {
    id?: true
    userId?: true
    publicationYear?: true
  }

  export type LiteratureMinAggregateInputType = {
    id?: true
    userId?: true
    title?: true
    author?: true
    publicationYear?: true
    type?: true
    description?: true
    url?: true
    publisher?: true
    journal?: true
    volume?: true
    issue?: true
    pages?: true
    doi?: true
    isbn?: true
    issn?: true
    language?: true
    keywords?: true
    abstract?: true
    externalId?: true
    syncSource?: true
    lastSyncedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LiteratureMaxAggregateInputType = {
    id?: true
    userId?: true
    title?: true
    author?: true
    publicationYear?: true
    type?: true
    description?: true
    url?: true
    publisher?: true
    journal?: true
    volume?: true
    issue?: true
    pages?: true
    doi?: true
    isbn?: true
    issn?: true
    language?: true
    keywords?: true
    abstract?: true
    externalId?: true
    syncSource?: true
    lastSyncedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LiteratureCountAggregateInputType = {
    id?: true
    userId?: true
    title?: true
    author?: true
    publicationYear?: true
    type?: true
    description?: true
    url?: true
    publisher?: true
    journal?: true
    volume?: true
    issue?: true
    pages?: true
    doi?: true
    isbn?: true
    issn?: true
    language?: true
    keywords?: true
    abstract?: true
    externalId?: true
    syncSource?: true
    lastSyncedAt?: true
    syncMetadata?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type LiteratureAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which literature to aggregate.
     */
    where?: literatureWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of literature to fetch.
     */
    orderBy?: literatureOrderByWithRelationInput | literatureOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: literatureWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` literature from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` literature.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned literature
    **/
    _count?: true | LiteratureCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: LiteratureAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: LiteratureSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LiteratureMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LiteratureMaxAggregateInputType
  }

  export type GetLiteratureAggregateType<T extends LiteratureAggregateArgs> = {
        [P in keyof T & keyof AggregateLiterature]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLiterature[P]>
      : GetScalarType<T[P], AggregateLiterature[P]>
  }




  export type literatureGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: literatureWhereInput
    orderBy?: literatureOrderByWithAggregationInput | literatureOrderByWithAggregationInput[]
    by: LiteratureScalarFieldEnum[] | LiteratureScalarFieldEnum
    having?: literatureScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LiteratureCountAggregateInputType | true
    _avg?: LiteratureAvgAggregateInputType
    _sum?: LiteratureSumAggregateInputType
    _min?: LiteratureMinAggregateInputType
    _max?: LiteratureMaxAggregateInputType
  }

  export type LiteratureGroupByOutputType = {
    id: number
    userId: number
    title: string
    author: string
    publicationYear: number | null
    type: string
    description: string | null
    url: string | null
    publisher: string | null
    journal: string | null
    volume: string | null
    issue: string | null
    pages: string | null
    doi: string | null
    isbn: string | null
    issn: string | null
    language: string | null
    keywords: string | null
    abstract: string | null
    externalId: string | null
    syncSource: string | null
    lastSyncedAt: Date | null
    syncMetadata: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: LiteratureCountAggregateOutputType | null
    _avg: LiteratureAvgAggregateOutputType | null
    _sum: LiteratureSumAggregateOutputType | null
    _min: LiteratureMinAggregateOutputType | null
    _max: LiteratureMaxAggregateOutputType | null
  }

  type GetLiteratureGroupByPayload<T extends literatureGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LiteratureGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LiteratureGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LiteratureGroupByOutputType[P]>
            : GetScalarType<T[P], LiteratureGroupByOutputType[P]>
        }
      >
    >


  export type literatureSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    title?: boolean
    author?: boolean
    publicationYear?: boolean
    type?: boolean
    description?: boolean
    url?: boolean
    publisher?: boolean
    journal?: boolean
    volume?: boolean
    issue?: boolean
    pages?: boolean
    doi?: boolean
    isbn?: boolean
    issn?: boolean
    language?: boolean
    keywords?: boolean
    abstract?: boolean
    externalId?: boolean
    syncSource?: boolean
    lastSyncedAt?: boolean
    syncMetadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["literature"]>



  export type literatureSelectScalar = {
    id?: boolean
    userId?: boolean
    title?: boolean
    author?: boolean
    publicationYear?: boolean
    type?: boolean
    description?: boolean
    url?: boolean
    publisher?: boolean
    journal?: boolean
    volume?: boolean
    issue?: boolean
    pages?: boolean
    doi?: boolean
    isbn?: boolean
    issn?: boolean
    language?: boolean
    keywords?: boolean
    abstract?: boolean
    externalId?: boolean
    syncSource?: boolean
    lastSyncedAt?: boolean
    syncMetadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type literatureOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "title" | "author" | "publicationYear" | "type" | "description" | "url" | "publisher" | "journal" | "volume" | "issue" | "pages" | "doi" | "isbn" | "issn" | "language" | "keywords" | "abstract" | "externalId" | "syncSource" | "lastSyncedAt" | "syncMetadata" | "createdAt" | "updatedAt", ExtArgs["result"]["literature"]>
  export type literatureInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $literaturePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "literature"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      userId: number
      title: string
      author: string
      publicationYear: number | null
      type: string
      description: string | null
      url: string | null
      publisher: string | null
      journal: string | null
      volume: string | null
      issue: string | null
      pages: string | null
      doi: string | null
      isbn: string | null
      issn: string | null
      language: string | null
      keywords: string | null
      abstract: string | null
      externalId: string | null
      syncSource: string | null
      lastSyncedAt: Date | null
      syncMetadata: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["literature"]>
    composites: {}
  }

  type literatureGetPayload<S extends boolean | null | undefined | literatureDefaultArgs> = $Result.GetResult<Prisma.$literaturePayload, S>

  type literatureCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<literatureFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: LiteratureCountAggregateInputType | true
    }

  export interface literatureDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['literature'], meta: { name: 'literature' } }
    /**
     * Find zero or one Literature that matches the filter.
     * @param {literatureFindUniqueArgs} args - Arguments to find a Literature
     * @example
     * // Get one Literature
     * const literature = await prisma.literature.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends literatureFindUniqueArgs>(args: SelectSubset<T, literatureFindUniqueArgs<ExtArgs>>): Prisma__literatureClient<$Result.GetResult<Prisma.$literaturePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Literature that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {literatureFindUniqueOrThrowArgs} args - Arguments to find a Literature
     * @example
     * // Get one Literature
     * const literature = await prisma.literature.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends literatureFindUniqueOrThrowArgs>(args: SelectSubset<T, literatureFindUniqueOrThrowArgs<ExtArgs>>): Prisma__literatureClient<$Result.GetResult<Prisma.$literaturePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Literature that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {literatureFindFirstArgs} args - Arguments to find a Literature
     * @example
     * // Get one Literature
     * const literature = await prisma.literature.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends literatureFindFirstArgs>(args?: SelectSubset<T, literatureFindFirstArgs<ExtArgs>>): Prisma__literatureClient<$Result.GetResult<Prisma.$literaturePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Literature that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {literatureFindFirstOrThrowArgs} args - Arguments to find a Literature
     * @example
     * // Get one Literature
     * const literature = await prisma.literature.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends literatureFindFirstOrThrowArgs>(args?: SelectSubset<T, literatureFindFirstOrThrowArgs<ExtArgs>>): Prisma__literatureClient<$Result.GetResult<Prisma.$literaturePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Literature that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {literatureFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Literature
     * const literature = await prisma.literature.findMany()
     * 
     * // Get first 10 Literature
     * const literature = await prisma.literature.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const literatureWithIdOnly = await prisma.literature.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends literatureFindManyArgs>(args?: SelectSubset<T, literatureFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$literaturePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Literature.
     * @param {literatureCreateArgs} args - Arguments to create a Literature.
     * @example
     * // Create one Literature
     * const Literature = await prisma.literature.create({
     *   data: {
     *     // ... data to create a Literature
     *   }
     * })
     * 
     */
    create<T extends literatureCreateArgs>(args: SelectSubset<T, literatureCreateArgs<ExtArgs>>): Prisma__literatureClient<$Result.GetResult<Prisma.$literaturePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Literature.
     * @param {literatureCreateManyArgs} args - Arguments to create many Literature.
     * @example
     * // Create many Literature
     * const literature = await prisma.literature.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends literatureCreateManyArgs>(args?: SelectSubset<T, literatureCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Literature.
     * @param {literatureDeleteArgs} args - Arguments to delete one Literature.
     * @example
     * // Delete one Literature
     * const Literature = await prisma.literature.delete({
     *   where: {
     *     // ... filter to delete one Literature
     *   }
     * })
     * 
     */
    delete<T extends literatureDeleteArgs>(args: SelectSubset<T, literatureDeleteArgs<ExtArgs>>): Prisma__literatureClient<$Result.GetResult<Prisma.$literaturePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Literature.
     * @param {literatureUpdateArgs} args - Arguments to update one Literature.
     * @example
     * // Update one Literature
     * const literature = await prisma.literature.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends literatureUpdateArgs>(args: SelectSubset<T, literatureUpdateArgs<ExtArgs>>): Prisma__literatureClient<$Result.GetResult<Prisma.$literaturePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Literature.
     * @param {literatureDeleteManyArgs} args - Arguments to filter Literature to delete.
     * @example
     * // Delete a few Literature
     * const { count } = await prisma.literature.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends literatureDeleteManyArgs>(args?: SelectSubset<T, literatureDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Literature.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {literatureUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Literature
     * const literature = await prisma.literature.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends literatureUpdateManyArgs>(args: SelectSubset<T, literatureUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Literature.
     * @param {literatureUpsertArgs} args - Arguments to update or create a Literature.
     * @example
     * // Update or create a Literature
     * const literature = await prisma.literature.upsert({
     *   create: {
     *     // ... data to create a Literature
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Literature we want to update
     *   }
     * })
     */
    upsert<T extends literatureUpsertArgs>(args: SelectSubset<T, literatureUpsertArgs<ExtArgs>>): Prisma__literatureClient<$Result.GetResult<Prisma.$literaturePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Literature.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {literatureCountArgs} args - Arguments to filter Literature to count.
     * @example
     * // Count the number of Literature
     * const count = await prisma.literature.count({
     *   where: {
     *     // ... the filter for the Literature we want to count
     *   }
     * })
    **/
    count<T extends literatureCountArgs>(
      args?: Subset<T, literatureCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LiteratureCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Literature.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LiteratureAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends LiteratureAggregateArgs>(args: Subset<T, LiteratureAggregateArgs>): Prisma.PrismaPromise<GetLiteratureAggregateType<T>>

    /**
     * Group by Literature.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {literatureGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends literatureGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: literatureGroupByArgs['orderBy'] }
        : { orderBy?: literatureGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, literatureGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLiteratureGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the literature model
   */
  readonly fields: literatureFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for literature.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__literatureClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the literature model
   */
  interface literatureFieldRefs {
    readonly id: FieldRef<"literature", 'Int'>
    readonly userId: FieldRef<"literature", 'Int'>
    readonly title: FieldRef<"literature", 'String'>
    readonly author: FieldRef<"literature", 'String'>
    readonly publicationYear: FieldRef<"literature", 'Int'>
    readonly type: FieldRef<"literature", 'String'>
    readonly description: FieldRef<"literature", 'String'>
    readonly url: FieldRef<"literature", 'String'>
    readonly publisher: FieldRef<"literature", 'String'>
    readonly journal: FieldRef<"literature", 'String'>
    readonly volume: FieldRef<"literature", 'String'>
    readonly issue: FieldRef<"literature", 'String'>
    readonly pages: FieldRef<"literature", 'String'>
    readonly doi: FieldRef<"literature", 'String'>
    readonly isbn: FieldRef<"literature", 'String'>
    readonly issn: FieldRef<"literature", 'String'>
    readonly language: FieldRef<"literature", 'String'>
    readonly keywords: FieldRef<"literature", 'String'>
    readonly abstract: FieldRef<"literature", 'String'>
    readonly externalId: FieldRef<"literature", 'String'>
    readonly syncSource: FieldRef<"literature", 'String'>
    readonly lastSyncedAt: FieldRef<"literature", 'DateTime'>
    readonly syncMetadata: FieldRef<"literature", 'Json'>
    readonly createdAt: FieldRef<"literature", 'DateTime'>
    readonly updatedAt: FieldRef<"literature", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * literature findUnique
   */
  export type literatureFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the literature
     */
    select?: literatureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the literature
     */
    omit?: literatureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: literatureInclude<ExtArgs> | null
    /**
     * Filter, which literature to fetch.
     */
    where: literatureWhereUniqueInput
  }

  /**
   * literature findUniqueOrThrow
   */
  export type literatureFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the literature
     */
    select?: literatureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the literature
     */
    omit?: literatureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: literatureInclude<ExtArgs> | null
    /**
     * Filter, which literature to fetch.
     */
    where: literatureWhereUniqueInput
  }

  /**
   * literature findFirst
   */
  export type literatureFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the literature
     */
    select?: literatureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the literature
     */
    omit?: literatureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: literatureInclude<ExtArgs> | null
    /**
     * Filter, which literature to fetch.
     */
    where?: literatureWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of literature to fetch.
     */
    orderBy?: literatureOrderByWithRelationInput | literatureOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for literature.
     */
    cursor?: literatureWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` literature from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` literature.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of literature.
     */
    distinct?: LiteratureScalarFieldEnum | LiteratureScalarFieldEnum[]
  }

  /**
   * literature findFirstOrThrow
   */
  export type literatureFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the literature
     */
    select?: literatureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the literature
     */
    omit?: literatureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: literatureInclude<ExtArgs> | null
    /**
     * Filter, which literature to fetch.
     */
    where?: literatureWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of literature to fetch.
     */
    orderBy?: literatureOrderByWithRelationInput | literatureOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for literature.
     */
    cursor?: literatureWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` literature from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` literature.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of literature.
     */
    distinct?: LiteratureScalarFieldEnum | LiteratureScalarFieldEnum[]
  }

  /**
   * literature findMany
   */
  export type literatureFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the literature
     */
    select?: literatureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the literature
     */
    omit?: literatureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: literatureInclude<ExtArgs> | null
    /**
     * Filter, which literature to fetch.
     */
    where?: literatureWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of literature to fetch.
     */
    orderBy?: literatureOrderByWithRelationInput | literatureOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing literature.
     */
    cursor?: literatureWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` literature from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` literature.
     */
    skip?: number
    distinct?: LiteratureScalarFieldEnum | LiteratureScalarFieldEnum[]
  }

  /**
   * literature create
   */
  export type literatureCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the literature
     */
    select?: literatureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the literature
     */
    omit?: literatureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: literatureInclude<ExtArgs> | null
    /**
     * The data needed to create a literature.
     */
    data: XOR<literatureCreateInput, literatureUncheckedCreateInput>
  }

  /**
   * literature createMany
   */
  export type literatureCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many literature.
     */
    data: literatureCreateManyInput | literatureCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * literature update
   */
  export type literatureUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the literature
     */
    select?: literatureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the literature
     */
    omit?: literatureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: literatureInclude<ExtArgs> | null
    /**
     * The data needed to update a literature.
     */
    data: XOR<literatureUpdateInput, literatureUncheckedUpdateInput>
    /**
     * Choose, which literature to update.
     */
    where: literatureWhereUniqueInput
  }

  /**
   * literature updateMany
   */
  export type literatureUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update literature.
     */
    data: XOR<literatureUpdateManyMutationInput, literatureUncheckedUpdateManyInput>
    /**
     * Filter which literature to update
     */
    where?: literatureWhereInput
    /**
     * Limit how many literature to update.
     */
    limit?: number
  }

  /**
   * literature upsert
   */
  export type literatureUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the literature
     */
    select?: literatureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the literature
     */
    omit?: literatureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: literatureInclude<ExtArgs> | null
    /**
     * The filter to search for the literature to update in case it exists.
     */
    where: literatureWhereUniqueInput
    /**
     * In case the literature found by the `where` argument doesn't exist, create a new literature with this data.
     */
    create: XOR<literatureCreateInput, literatureUncheckedCreateInput>
    /**
     * In case the literature was found with the provided `where` argument, update it with this data.
     */
    update: XOR<literatureUpdateInput, literatureUncheckedUpdateInput>
  }

  /**
   * literature delete
   */
  export type literatureDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the literature
     */
    select?: literatureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the literature
     */
    omit?: literatureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: literatureInclude<ExtArgs> | null
    /**
     * Filter which literature to delete.
     */
    where: literatureWhereUniqueInput
  }

  /**
   * literature deleteMany
   */
  export type literatureDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which literature to delete
     */
    where?: literatureWhereInput
    /**
     * Limit how many literature to delete.
     */
    limit?: number
  }

  /**
   * literature without action
   */
  export type literatureDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the literature
     */
    select?: literatureSelect<ExtArgs> | null
    /**
     * Omit specific fields from the literature
     */
    omit?: literatureOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: literatureInclude<ExtArgs> | null
  }


  /**
   * Model BibliographySync
   */

  export type AggregateBibliographySync = {
    _count: BibliographySyncCountAggregateOutputType | null
    _avg: BibliographySyncAvgAggregateOutputType | null
    _sum: BibliographySyncSumAggregateOutputType | null
    _min: BibliographySyncMinAggregateOutputType | null
    _max: BibliographySyncMaxAggregateOutputType | null
  }

  export type BibliographySyncAvgAggregateOutputType = {
    id: number | null
    userId: number | null
    syncInterval: number | null
  }

  export type BibliographySyncSumAggregateOutputType = {
    id: number | null
    userId: number | null
    syncInterval: number | null
  }

  export type BibliographySyncMinAggregateOutputType = {
    id: number | null
    userId: number | null
    service: string | null
    name: string | null
    isActive: boolean | null
    apiKey: string | null
    apiSecret: string | null
    accessToken: string | null
    refreshToken: string | null
    tokenExpiresAt: Date | null
    collectionId: string | null
    collectionName: string | null
    autoSync: boolean | null
    syncInterval: number | null
    lastSyncAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type BibliographySyncMaxAggregateOutputType = {
    id: number | null
    userId: number | null
    service: string | null
    name: string | null
    isActive: boolean | null
    apiKey: string | null
    apiSecret: string | null
    accessToken: string | null
    refreshToken: string | null
    tokenExpiresAt: Date | null
    collectionId: string | null
    collectionName: string | null
    autoSync: boolean | null
    syncInterval: number | null
    lastSyncAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type BibliographySyncCountAggregateOutputType = {
    id: number
    userId: number
    service: number
    name: number
    isActive: number
    apiKey: number
    apiSecret: number
    accessToken: number
    refreshToken: number
    tokenExpiresAt: number
    collectionId: number
    collectionName: number
    autoSync: number
    syncInterval: number
    lastSyncAt: number
    syncMetadata: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type BibliographySyncAvgAggregateInputType = {
    id?: true
    userId?: true
    syncInterval?: true
  }

  export type BibliographySyncSumAggregateInputType = {
    id?: true
    userId?: true
    syncInterval?: true
  }

  export type BibliographySyncMinAggregateInputType = {
    id?: true
    userId?: true
    service?: true
    name?: true
    isActive?: true
    apiKey?: true
    apiSecret?: true
    accessToken?: true
    refreshToken?: true
    tokenExpiresAt?: true
    collectionId?: true
    collectionName?: true
    autoSync?: true
    syncInterval?: true
    lastSyncAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type BibliographySyncMaxAggregateInputType = {
    id?: true
    userId?: true
    service?: true
    name?: true
    isActive?: true
    apiKey?: true
    apiSecret?: true
    accessToken?: true
    refreshToken?: true
    tokenExpiresAt?: true
    collectionId?: true
    collectionName?: true
    autoSync?: true
    syncInterval?: true
    lastSyncAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type BibliographySyncCountAggregateInputType = {
    id?: true
    userId?: true
    service?: true
    name?: true
    isActive?: true
    apiKey?: true
    apiSecret?: true
    accessToken?: true
    refreshToken?: true
    tokenExpiresAt?: true
    collectionId?: true
    collectionName?: true
    autoSync?: true
    syncInterval?: true
    lastSyncAt?: true
    syncMetadata?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type BibliographySyncAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BibliographySync to aggregate.
     */
    where?: BibliographySyncWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BibliographySyncs to fetch.
     */
    orderBy?: BibliographySyncOrderByWithRelationInput | BibliographySyncOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: BibliographySyncWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BibliographySyncs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BibliographySyncs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned BibliographySyncs
    **/
    _count?: true | BibliographySyncCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: BibliographySyncAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: BibliographySyncSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: BibliographySyncMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: BibliographySyncMaxAggregateInputType
  }

  export type GetBibliographySyncAggregateType<T extends BibliographySyncAggregateArgs> = {
        [P in keyof T & keyof AggregateBibliographySync]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBibliographySync[P]>
      : GetScalarType<T[P], AggregateBibliographySync[P]>
  }




  export type BibliographySyncGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BibliographySyncWhereInput
    orderBy?: BibliographySyncOrderByWithAggregationInput | BibliographySyncOrderByWithAggregationInput[]
    by: BibliographySyncScalarFieldEnum[] | BibliographySyncScalarFieldEnum
    having?: BibliographySyncScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: BibliographySyncCountAggregateInputType | true
    _avg?: BibliographySyncAvgAggregateInputType
    _sum?: BibliographySyncSumAggregateInputType
    _min?: BibliographySyncMinAggregateInputType
    _max?: BibliographySyncMaxAggregateInputType
  }

  export type BibliographySyncGroupByOutputType = {
    id: number
    userId: number
    service: string
    name: string
    isActive: boolean
    apiKey: string | null
    apiSecret: string | null
    accessToken: string | null
    refreshToken: string | null
    tokenExpiresAt: Date | null
    collectionId: string | null
    collectionName: string | null
    autoSync: boolean
    syncInterval: number | null
    lastSyncAt: Date | null
    syncMetadata: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: BibliographySyncCountAggregateOutputType | null
    _avg: BibliographySyncAvgAggregateOutputType | null
    _sum: BibliographySyncSumAggregateOutputType | null
    _min: BibliographySyncMinAggregateOutputType | null
    _max: BibliographySyncMaxAggregateOutputType | null
  }

  type GetBibliographySyncGroupByPayload<T extends BibliographySyncGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<BibliographySyncGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof BibliographySyncGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], BibliographySyncGroupByOutputType[P]>
            : GetScalarType<T[P], BibliographySyncGroupByOutputType[P]>
        }
      >
    >


  export type BibliographySyncSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    service?: boolean
    name?: boolean
    isActive?: boolean
    apiKey?: boolean
    apiSecret?: boolean
    accessToken?: boolean
    refreshToken?: boolean
    tokenExpiresAt?: boolean
    collectionId?: boolean
    collectionName?: boolean
    autoSync?: boolean
    syncInterval?: boolean
    lastSyncAt?: boolean
    syncMetadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["bibliographySync"]>



  export type BibliographySyncSelectScalar = {
    id?: boolean
    userId?: boolean
    service?: boolean
    name?: boolean
    isActive?: boolean
    apiKey?: boolean
    apiSecret?: boolean
    accessToken?: boolean
    refreshToken?: boolean
    tokenExpiresAt?: boolean
    collectionId?: boolean
    collectionName?: boolean
    autoSync?: boolean
    syncInterval?: boolean
    lastSyncAt?: boolean
    syncMetadata?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type BibliographySyncOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "service" | "name" | "isActive" | "apiKey" | "apiSecret" | "accessToken" | "refreshToken" | "tokenExpiresAt" | "collectionId" | "collectionName" | "autoSync" | "syncInterval" | "lastSyncAt" | "syncMetadata" | "createdAt" | "updatedAt", ExtArgs["result"]["bibliographySync"]>
  export type BibliographySyncInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $BibliographySyncPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "BibliographySync"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      userId: number
      service: string
      name: string
      isActive: boolean
      apiKey: string | null
      apiSecret: string | null
      accessToken: string | null
      refreshToken: string | null
      tokenExpiresAt: Date | null
      collectionId: string | null
      collectionName: string | null
      autoSync: boolean
      syncInterval: number | null
      lastSyncAt: Date | null
      syncMetadata: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["bibliographySync"]>
    composites: {}
  }

  type BibliographySyncGetPayload<S extends boolean | null | undefined | BibliographySyncDefaultArgs> = $Result.GetResult<Prisma.$BibliographySyncPayload, S>

  type BibliographySyncCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<BibliographySyncFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: BibliographySyncCountAggregateInputType | true
    }

  export interface BibliographySyncDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['BibliographySync'], meta: { name: 'BibliographySync' } }
    /**
     * Find zero or one BibliographySync that matches the filter.
     * @param {BibliographySyncFindUniqueArgs} args - Arguments to find a BibliographySync
     * @example
     * // Get one BibliographySync
     * const bibliographySync = await prisma.bibliographySync.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends BibliographySyncFindUniqueArgs>(args: SelectSubset<T, BibliographySyncFindUniqueArgs<ExtArgs>>): Prisma__BibliographySyncClient<$Result.GetResult<Prisma.$BibliographySyncPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one BibliographySync that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {BibliographySyncFindUniqueOrThrowArgs} args - Arguments to find a BibliographySync
     * @example
     * // Get one BibliographySync
     * const bibliographySync = await prisma.bibliographySync.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends BibliographySyncFindUniqueOrThrowArgs>(args: SelectSubset<T, BibliographySyncFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BibliographySyncClient<$Result.GetResult<Prisma.$BibliographySyncPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first BibliographySync that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BibliographySyncFindFirstArgs} args - Arguments to find a BibliographySync
     * @example
     * // Get one BibliographySync
     * const bibliographySync = await prisma.bibliographySync.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends BibliographySyncFindFirstArgs>(args?: SelectSubset<T, BibliographySyncFindFirstArgs<ExtArgs>>): Prisma__BibliographySyncClient<$Result.GetResult<Prisma.$BibliographySyncPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first BibliographySync that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BibliographySyncFindFirstOrThrowArgs} args - Arguments to find a BibliographySync
     * @example
     * // Get one BibliographySync
     * const bibliographySync = await prisma.bibliographySync.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends BibliographySyncFindFirstOrThrowArgs>(args?: SelectSubset<T, BibliographySyncFindFirstOrThrowArgs<ExtArgs>>): Prisma__BibliographySyncClient<$Result.GetResult<Prisma.$BibliographySyncPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more BibliographySyncs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BibliographySyncFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all BibliographySyncs
     * const bibliographySyncs = await prisma.bibliographySync.findMany()
     * 
     * // Get first 10 BibliographySyncs
     * const bibliographySyncs = await prisma.bibliographySync.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const bibliographySyncWithIdOnly = await prisma.bibliographySync.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends BibliographySyncFindManyArgs>(args?: SelectSubset<T, BibliographySyncFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BibliographySyncPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a BibliographySync.
     * @param {BibliographySyncCreateArgs} args - Arguments to create a BibliographySync.
     * @example
     * // Create one BibliographySync
     * const BibliographySync = await prisma.bibliographySync.create({
     *   data: {
     *     // ... data to create a BibliographySync
     *   }
     * })
     * 
     */
    create<T extends BibliographySyncCreateArgs>(args: SelectSubset<T, BibliographySyncCreateArgs<ExtArgs>>): Prisma__BibliographySyncClient<$Result.GetResult<Prisma.$BibliographySyncPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many BibliographySyncs.
     * @param {BibliographySyncCreateManyArgs} args - Arguments to create many BibliographySyncs.
     * @example
     * // Create many BibliographySyncs
     * const bibliographySync = await prisma.bibliographySync.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends BibliographySyncCreateManyArgs>(args?: SelectSubset<T, BibliographySyncCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a BibliographySync.
     * @param {BibliographySyncDeleteArgs} args - Arguments to delete one BibliographySync.
     * @example
     * // Delete one BibliographySync
     * const BibliographySync = await prisma.bibliographySync.delete({
     *   where: {
     *     // ... filter to delete one BibliographySync
     *   }
     * })
     * 
     */
    delete<T extends BibliographySyncDeleteArgs>(args: SelectSubset<T, BibliographySyncDeleteArgs<ExtArgs>>): Prisma__BibliographySyncClient<$Result.GetResult<Prisma.$BibliographySyncPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one BibliographySync.
     * @param {BibliographySyncUpdateArgs} args - Arguments to update one BibliographySync.
     * @example
     * // Update one BibliographySync
     * const bibliographySync = await prisma.bibliographySync.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends BibliographySyncUpdateArgs>(args: SelectSubset<T, BibliographySyncUpdateArgs<ExtArgs>>): Prisma__BibliographySyncClient<$Result.GetResult<Prisma.$BibliographySyncPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more BibliographySyncs.
     * @param {BibliographySyncDeleteManyArgs} args - Arguments to filter BibliographySyncs to delete.
     * @example
     * // Delete a few BibliographySyncs
     * const { count } = await prisma.bibliographySync.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends BibliographySyncDeleteManyArgs>(args?: SelectSubset<T, BibliographySyncDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more BibliographySyncs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BibliographySyncUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many BibliographySyncs
     * const bibliographySync = await prisma.bibliographySync.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends BibliographySyncUpdateManyArgs>(args: SelectSubset<T, BibliographySyncUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one BibliographySync.
     * @param {BibliographySyncUpsertArgs} args - Arguments to update or create a BibliographySync.
     * @example
     * // Update or create a BibliographySync
     * const bibliographySync = await prisma.bibliographySync.upsert({
     *   create: {
     *     // ... data to create a BibliographySync
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the BibliographySync we want to update
     *   }
     * })
     */
    upsert<T extends BibliographySyncUpsertArgs>(args: SelectSubset<T, BibliographySyncUpsertArgs<ExtArgs>>): Prisma__BibliographySyncClient<$Result.GetResult<Prisma.$BibliographySyncPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of BibliographySyncs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BibliographySyncCountArgs} args - Arguments to filter BibliographySyncs to count.
     * @example
     * // Count the number of BibliographySyncs
     * const count = await prisma.bibliographySync.count({
     *   where: {
     *     // ... the filter for the BibliographySyncs we want to count
     *   }
     * })
    **/
    count<T extends BibliographySyncCountArgs>(
      args?: Subset<T, BibliographySyncCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], BibliographySyncCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a BibliographySync.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BibliographySyncAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends BibliographySyncAggregateArgs>(args: Subset<T, BibliographySyncAggregateArgs>): Prisma.PrismaPromise<GetBibliographySyncAggregateType<T>>

    /**
     * Group by BibliographySync.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BibliographySyncGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends BibliographySyncGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: BibliographySyncGroupByArgs['orderBy'] }
        : { orderBy?: BibliographySyncGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, BibliographySyncGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBibliographySyncGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the BibliographySync model
   */
  readonly fields: BibliographySyncFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for BibliographySync.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__BibliographySyncClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the BibliographySync model
   */
  interface BibliographySyncFieldRefs {
    readonly id: FieldRef<"BibliographySync", 'Int'>
    readonly userId: FieldRef<"BibliographySync", 'Int'>
    readonly service: FieldRef<"BibliographySync", 'String'>
    readonly name: FieldRef<"BibliographySync", 'String'>
    readonly isActive: FieldRef<"BibliographySync", 'Boolean'>
    readonly apiKey: FieldRef<"BibliographySync", 'String'>
    readonly apiSecret: FieldRef<"BibliographySync", 'String'>
    readonly accessToken: FieldRef<"BibliographySync", 'String'>
    readonly refreshToken: FieldRef<"BibliographySync", 'String'>
    readonly tokenExpiresAt: FieldRef<"BibliographySync", 'DateTime'>
    readonly collectionId: FieldRef<"BibliographySync", 'String'>
    readonly collectionName: FieldRef<"BibliographySync", 'String'>
    readonly autoSync: FieldRef<"BibliographySync", 'Boolean'>
    readonly syncInterval: FieldRef<"BibliographySync", 'Int'>
    readonly lastSyncAt: FieldRef<"BibliographySync", 'DateTime'>
    readonly syncMetadata: FieldRef<"BibliographySync", 'Json'>
    readonly createdAt: FieldRef<"BibliographySync", 'DateTime'>
    readonly updatedAt: FieldRef<"BibliographySync", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * BibliographySync findUnique
   */
  export type BibliographySyncFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BibliographySync
     */
    select?: BibliographySyncSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BibliographySync
     */
    omit?: BibliographySyncOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BibliographySyncInclude<ExtArgs> | null
    /**
     * Filter, which BibliographySync to fetch.
     */
    where: BibliographySyncWhereUniqueInput
  }

  /**
   * BibliographySync findUniqueOrThrow
   */
  export type BibliographySyncFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BibliographySync
     */
    select?: BibliographySyncSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BibliographySync
     */
    omit?: BibliographySyncOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BibliographySyncInclude<ExtArgs> | null
    /**
     * Filter, which BibliographySync to fetch.
     */
    where: BibliographySyncWhereUniqueInput
  }

  /**
   * BibliographySync findFirst
   */
  export type BibliographySyncFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BibliographySync
     */
    select?: BibliographySyncSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BibliographySync
     */
    omit?: BibliographySyncOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BibliographySyncInclude<ExtArgs> | null
    /**
     * Filter, which BibliographySync to fetch.
     */
    where?: BibliographySyncWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BibliographySyncs to fetch.
     */
    orderBy?: BibliographySyncOrderByWithRelationInput | BibliographySyncOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BibliographySyncs.
     */
    cursor?: BibliographySyncWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BibliographySyncs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BibliographySyncs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BibliographySyncs.
     */
    distinct?: BibliographySyncScalarFieldEnum | BibliographySyncScalarFieldEnum[]
  }

  /**
   * BibliographySync findFirstOrThrow
   */
  export type BibliographySyncFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BibliographySync
     */
    select?: BibliographySyncSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BibliographySync
     */
    omit?: BibliographySyncOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BibliographySyncInclude<ExtArgs> | null
    /**
     * Filter, which BibliographySync to fetch.
     */
    where?: BibliographySyncWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BibliographySyncs to fetch.
     */
    orderBy?: BibliographySyncOrderByWithRelationInput | BibliographySyncOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BibliographySyncs.
     */
    cursor?: BibliographySyncWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BibliographySyncs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BibliographySyncs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BibliographySyncs.
     */
    distinct?: BibliographySyncScalarFieldEnum | BibliographySyncScalarFieldEnum[]
  }

  /**
   * BibliographySync findMany
   */
  export type BibliographySyncFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BibliographySync
     */
    select?: BibliographySyncSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BibliographySync
     */
    omit?: BibliographySyncOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BibliographySyncInclude<ExtArgs> | null
    /**
     * Filter, which BibliographySyncs to fetch.
     */
    where?: BibliographySyncWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BibliographySyncs to fetch.
     */
    orderBy?: BibliographySyncOrderByWithRelationInput | BibliographySyncOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing BibliographySyncs.
     */
    cursor?: BibliographySyncWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BibliographySyncs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BibliographySyncs.
     */
    skip?: number
    distinct?: BibliographySyncScalarFieldEnum | BibliographySyncScalarFieldEnum[]
  }

  /**
   * BibliographySync create
   */
  export type BibliographySyncCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BibliographySync
     */
    select?: BibliographySyncSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BibliographySync
     */
    omit?: BibliographySyncOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BibliographySyncInclude<ExtArgs> | null
    /**
     * The data needed to create a BibliographySync.
     */
    data: XOR<BibliographySyncCreateInput, BibliographySyncUncheckedCreateInput>
  }

  /**
   * BibliographySync createMany
   */
  export type BibliographySyncCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many BibliographySyncs.
     */
    data: BibliographySyncCreateManyInput | BibliographySyncCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * BibliographySync update
   */
  export type BibliographySyncUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BibliographySync
     */
    select?: BibliographySyncSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BibliographySync
     */
    omit?: BibliographySyncOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BibliographySyncInclude<ExtArgs> | null
    /**
     * The data needed to update a BibliographySync.
     */
    data: XOR<BibliographySyncUpdateInput, BibliographySyncUncheckedUpdateInput>
    /**
     * Choose, which BibliographySync to update.
     */
    where: BibliographySyncWhereUniqueInput
  }

  /**
   * BibliographySync updateMany
   */
  export type BibliographySyncUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update BibliographySyncs.
     */
    data: XOR<BibliographySyncUpdateManyMutationInput, BibliographySyncUncheckedUpdateManyInput>
    /**
     * Filter which BibliographySyncs to update
     */
    where?: BibliographySyncWhereInput
    /**
     * Limit how many BibliographySyncs to update.
     */
    limit?: number
  }

  /**
   * BibliographySync upsert
   */
  export type BibliographySyncUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BibliographySync
     */
    select?: BibliographySyncSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BibliographySync
     */
    omit?: BibliographySyncOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BibliographySyncInclude<ExtArgs> | null
    /**
     * The filter to search for the BibliographySync to update in case it exists.
     */
    where: BibliographySyncWhereUniqueInput
    /**
     * In case the BibliographySync found by the `where` argument doesn't exist, create a new BibliographySync with this data.
     */
    create: XOR<BibliographySyncCreateInput, BibliographySyncUncheckedCreateInput>
    /**
     * In case the BibliographySync was found with the provided `where` argument, update it with this data.
     */
    update: XOR<BibliographySyncUpdateInput, BibliographySyncUncheckedUpdateInput>
  }

  /**
   * BibliographySync delete
   */
  export type BibliographySyncDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BibliographySync
     */
    select?: BibliographySyncSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BibliographySync
     */
    omit?: BibliographySyncOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BibliographySyncInclude<ExtArgs> | null
    /**
     * Filter which BibliographySync to delete.
     */
    where: BibliographySyncWhereUniqueInput
  }

  /**
   * BibliographySync deleteMany
   */
  export type BibliographySyncDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BibliographySyncs to delete
     */
    where?: BibliographySyncWhereInput
    /**
     * Limit how many BibliographySyncs to delete.
     */
    limit?: number
  }

  /**
   * BibliographySync without action
   */
  export type BibliographySyncDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BibliographySync
     */
    select?: BibliographySyncSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BibliographySync
     */
    omit?: BibliographySyncOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BibliographySyncInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    email: 'email',
    name: 'name',
    password: 'password',
    role: 'role',
    emailVerified: 'emailVerified',
    emailVerifiedAt: 'emailVerifiedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    lastLoginAt: 'lastLoginAt'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const EmailConfirmationScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    token: 'token',
    expiresAt: 'expiresAt',
    createdAt: 'createdAt'
  };

  export type EmailConfirmationScalarFieldEnum = (typeof EmailConfirmationScalarFieldEnum)[keyof typeof EmailConfirmationScalarFieldEnum]


  export const PasswordResetScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    token: 'token',
    expiresAt: 'expiresAt',
    used: 'used',
    createdAt: 'createdAt'
  };

  export type PasswordResetScalarFieldEnum = (typeof PasswordResetScalarFieldEnum)[keyof typeof PasswordResetScalarFieldEnum]


  export const RefreshTokenScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    token: 'token',
    expiresAt: 'expiresAt',
    createdAt: 'createdAt'
  };

  export type RefreshTokenScalarFieldEnum = (typeof RefreshTokenScalarFieldEnum)[keyof typeof RefreshTokenScalarFieldEnum]


  export const EventsScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    title: 'title',
    description: 'description',
    date: 'date',
    end_date: 'end_date',
    location: 'location'
  };

  export type EventsScalarFieldEnum = (typeof EventsScalarFieldEnum)[keyof typeof EventsScalarFieldEnum]


  export const Event_typesScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    name: 'name',
    icon: 'icon',
    color: 'color'
  };

  export type Event_typesScalarFieldEnum = (typeof Event_typesScalarFieldEnum)[keyof typeof Event_typesScalarFieldEnum]


  export const Life_eventsScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    person_id: 'person_id',
    event_id: 'event_id',
    title: 'title',
    start_date: 'start_date',
    end_date: 'end_date',
    location: 'location',
    description: 'description',
    metadata: 'metadata',
    event_type_id: 'event_type_id'
  };

  export type Life_eventsScalarFieldEnum = (typeof Life_eventsScalarFieldEnum)[keyof typeof Life_eventsScalarFieldEnum]


  export const PersonsScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    first_name: 'first_name',
    last_name: 'last_name',
    birth_date: 'birth_date',
    birth_place: 'birth_place',
    death_date: 'death_date',
    death_place: 'death_place',
    notes: 'notes'
  };

  export type PersonsScalarFieldEnum = (typeof PersonsScalarFieldEnum)[keyof typeof PersonsScalarFieldEnum]


  export const Person_relationsScalarFieldEnum: {
    id: 'id',
    from_person_id: 'from_person_id',
    to_person_id: 'to_person_id',
    relation_type: 'relation_type',
    notes: 'notes'
  };

  export type Person_relationsScalarFieldEnum = (typeof Person_relationsScalarFieldEnum)[keyof typeof Person_relationsScalarFieldEnum]


  export const LiteratureScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    title: 'title',
    author: 'author',
    publicationYear: 'publicationYear',
    type: 'type',
    description: 'description',
    url: 'url',
    publisher: 'publisher',
    journal: 'journal',
    volume: 'volume',
    issue: 'issue',
    pages: 'pages',
    doi: 'doi',
    isbn: 'isbn',
    issn: 'issn',
    language: 'language',
    keywords: 'keywords',
    abstract: 'abstract',
    externalId: 'externalId',
    syncSource: 'syncSource',
    lastSyncedAt: 'lastSyncedAt',
    syncMetadata: 'syncMetadata',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type LiteratureScalarFieldEnum = (typeof LiteratureScalarFieldEnum)[keyof typeof LiteratureScalarFieldEnum]


  export const BibliographySyncScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    service: 'service',
    name: 'name',
    isActive: 'isActive',
    apiKey: 'apiKey',
    apiSecret: 'apiSecret',
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
    tokenExpiresAt: 'tokenExpiresAt',
    collectionId: 'collectionId',
    collectionName: 'collectionName',
    autoSync: 'autoSync',
    syncInterval: 'syncInterval',
    lastSyncAt: 'lastSyncAt',
    syncMetadata: 'syncMetadata',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type BibliographySyncScalarFieldEnum = (typeof BibliographySyncScalarFieldEnum)[keyof typeof BibliographySyncScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const UserOrderByRelevanceFieldEnum: {
    email: 'email',
    name: 'name',
    password: 'password'
  };

  export type UserOrderByRelevanceFieldEnum = (typeof UserOrderByRelevanceFieldEnum)[keyof typeof UserOrderByRelevanceFieldEnum]


  export const EmailConfirmationOrderByRelevanceFieldEnum: {
    token: 'token'
  };

  export type EmailConfirmationOrderByRelevanceFieldEnum = (typeof EmailConfirmationOrderByRelevanceFieldEnum)[keyof typeof EmailConfirmationOrderByRelevanceFieldEnum]


  export const PasswordResetOrderByRelevanceFieldEnum: {
    token: 'token'
  };

  export type PasswordResetOrderByRelevanceFieldEnum = (typeof PasswordResetOrderByRelevanceFieldEnum)[keyof typeof PasswordResetOrderByRelevanceFieldEnum]


  export const RefreshTokenOrderByRelevanceFieldEnum: {
    token: 'token'
  };

  export type RefreshTokenOrderByRelevanceFieldEnum = (typeof RefreshTokenOrderByRelevanceFieldEnum)[keyof typeof RefreshTokenOrderByRelevanceFieldEnum]


  export const eventsOrderByRelevanceFieldEnum: {
    title: 'title',
    description: 'description',
    location: 'location'
  };

  export type eventsOrderByRelevanceFieldEnum = (typeof eventsOrderByRelevanceFieldEnum)[keyof typeof eventsOrderByRelevanceFieldEnum]


  export const event_typesOrderByRelevanceFieldEnum: {
    name: 'name',
    icon: 'icon',
    color: 'color'
  };

  export type event_typesOrderByRelevanceFieldEnum = (typeof event_typesOrderByRelevanceFieldEnum)[keyof typeof event_typesOrderByRelevanceFieldEnum]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const life_eventsOrderByRelevanceFieldEnum: {
    title: 'title',
    location: 'location',
    description: 'description'
  };

  export type life_eventsOrderByRelevanceFieldEnum = (typeof life_eventsOrderByRelevanceFieldEnum)[keyof typeof life_eventsOrderByRelevanceFieldEnum]


  export const personsOrderByRelevanceFieldEnum: {
    first_name: 'first_name',
    last_name: 'last_name',
    birth_place: 'birth_place',
    death_place: 'death_place',
    notes: 'notes'
  };

  export type personsOrderByRelevanceFieldEnum = (typeof personsOrderByRelevanceFieldEnum)[keyof typeof personsOrderByRelevanceFieldEnum]


  export const person_relationsOrderByRelevanceFieldEnum: {
    relation_type: 'relation_type',
    notes: 'notes'
  };

  export type person_relationsOrderByRelevanceFieldEnum = (typeof person_relationsOrderByRelevanceFieldEnum)[keyof typeof person_relationsOrderByRelevanceFieldEnum]


  export const literatureOrderByRelevanceFieldEnum: {
    title: 'title',
    author: 'author',
    type: 'type',
    description: 'description',
    url: 'url',
    publisher: 'publisher',
    journal: 'journal',
    volume: 'volume',
    issue: 'issue',
    pages: 'pages',
    doi: 'doi',
    isbn: 'isbn',
    issn: 'issn',
    language: 'language',
    keywords: 'keywords',
    abstract: 'abstract',
    externalId: 'externalId',
    syncSource: 'syncSource'
  };

  export type literatureOrderByRelevanceFieldEnum = (typeof literatureOrderByRelevanceFieldEnum)[keyof typeof literatureOrderByRelevanceFieldEnum]


  export const BibliographySyncOrderByRelevanceFieldEnum: {
    service: 'service',
    name: 'name',
    apiKey: 'apiKey',
    apiSecret: 'apiSecret',
    accessToken: 'accessToken',
    refreshToken: 'refreshToken',
    collectionId: 'collectionId',
    collectionName: 'collectionName'
  };

  export type BibliographySyncOrderByRelevanceFieldEnum = (typeof BibliographySyncOrderByRelevanceFieldEnum)[keyof typeof BibliographySyncOrderByRelevanceFieldEnum]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'UserRole'
   */
  export type EnumUserRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'UserRole'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: IntFilter<"User"> | number
    email?: StringFilter<"User"> | string
    name?: StringFilter<"User"> | string
    password?: StringFilter<"User"> | string
    role?: EnumUserRoleFilter<"User"> | $Enums.UserRole
    emailVerified?: BoolFilter<"User"> | boolean
    emailVerifiedAt?: DateTimeNullableFilter<"User"> | Date | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    lastLoginAt?: DateTimeNullableFilter<"User"> | Date | string | null
    emailConfirmations?: EmailConfirmationListRelationFilter
    passwordResets?: PasswordResetListRelationFilter
    refreshTokens?: RefreshTokenListRelationFilter
    events?: EventsListRelationFilter
    persons?: PersonsListRelationFilter
    life_events?: Life_eventsListRelationFilter
    event_types?: Event_typesListRelationFilter
    literature?: LiteratureListRelationFilter
    bibliographySyncs?: BibliographySyncListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    password?: SortOrder
    role?: SortOrder
    emailVerified?: SortOrder
    emailVerifiedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lastLoginAt?: SortOrderInput | SortOrder
    emailConfirmations?: EmailConfirmationOrderByRelationAggregateInput
    passwordResets?: PasswordResetOrderByRelationAggregateInput
    refreshTokens?: RefreshTokenOrderByRelationAggregateInput
    events?: eventsOrderByRelationAggregateInput
    persons?: personsOrderByRelationAggregateInput
    life_events?: life_eventsOrderByRelationAggregateInput
    event_types?: event_typesOrderByRelationAggregateInput
    literature?: literatureOrderByRelationAggregateInput
    bibliographySyncs?: BibliographySyncOrderByRelationAggregateInput
    _relevance?: UserOrderByRelevanceInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    email?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    name?: StringFilter<"User"> | string
    password?: StringFilter<"User"> | string
    role?: EnumUserRoleFilter<"User"> | $Enums.UserRole
    emailVerified?: BoolFilter<"User"> | boolean
    emailVerifiedAt?: DateTimeNullableFilter<"User"> | Date | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    lastLoginAt?: DateTimeNullableFilter<"User"> | Date | string | null
    emailConfirmations?: EmailConfirmationListRelationFilter
    passwordResets?: PasswordResetListRelationFilter
    refreshTokens?: RefreshTokenListRelationFilter
    events?: EventsListRelationFilter
    persons?: PersonsListRelationFilter
    life_events?: Life_eventsListRelationFilter
    event_types?: Event_typesListRelationFilter
    literature?: LiteratureListRelationFilter
    bibliographySyncs?: BibliographySyncListRelationFilter
  }, "id" | "email">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    password?: SortOrder
    role?: SortOrder
    emailVerified?: SortOrder
    emailVerifiedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lastLoginAt?: SortOrderInput | SortOrder
    _count?: UserCountOrderByAggregateInput
    _avg?: UserAvgOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
    _sum?: UserSumOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"User"> | number
    email?: StringWithAggregatesFilter<"User"> | string
    name?: StringWithAggregatesFilter<"User"> | string
    password?: StringWithAggregatesFilter<"User"> | string
    role?: EnumUserRoleWithAggregatesFilter<"User"> | $Enums.UserRole
    emailVerified?: BoolWithAggregatesFilter<"User"> | boolean
    emailVerifiedAt?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    lastLoginAt?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
  }

  export type EmailConfirmationWhereInput = {
    AND?: EmailConfirmationWhereInput | EmailConfirmationWhereInput[]
    OR?: EmailConfirmationWhereInput[]
    NOT?: EmailConfirmationWhereInput | EmailConfirmationWhereInput[]
    id?: IntFilter<"EmailConfirmation"> | number
    userId?: IntFilter<"EmailConfirmation"> | number
    token?: StringFilter<"EmailConfirmation"> | string
    expiresAt?: DateTimeFilter<"EmailConfirmation"> | Date | string
    createdAt?: DateTimeFilter<"EmailConfirmation"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type EmailConfirmationOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    user?: UserOrderByWithRelationInput
    _relevance?: EmailConfirmationOrderByRelevanceInput
  }

  export type EmailConfirmationWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    token?: string
    AND?: EmailConfirmationWhereInput | EmailConfirmationWhereInput[]
    OR?: EmailConfirmationWhereInput[]
    NOT?: EmailConfirmationWhereInput | EmailConfirmationWhereInput[]
    userId?: IntFilter<"EmailConfirmation"> | number
    expiresAt?: DateTimeFilter<"EmailConfirmation"> | Date | string
    createdAt?: DateTimeFilter<"EmailConfirmation"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "token">

  export type EmailConfirmationOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    _count?: EmailConfirmationCountOrderByAggregateInput
    _avg?: EmailConfirmationAvgOrderByAggregateInput
    _max?: EmailConfirmationMaxOrderByAggregateInput
    _min?: EmailConfirmationMinOrderByAggregateInput
    _sum?: EmailConfirmationSumOrderByAggregateInput
  }

  export type EmailConfirmationScalarWhereWithAggregatesInput = {
    AND?: EmailConfirmationScalarWhereWithAggregatesInput | EmailConfirmationScalarWhereWithAggregatesInput[]
    OR?: EmailConfirmationScalarWhereWithAggregatesInput[]
    NOT?: EmailConfirmationScalarWhereWithAggregatesInput | EmailConfirmationScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"EmailConfirmation"> | number
    userId?: IntWithAggregatesFilter<"EmailConfirmation"> | number
    token?: StringWithAggregatesFilter<"EmailConfirmation"> | string
    expiresAt?: DateTimeWithAggregatesFilter<"EmailConfirmation"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"EmailConfirmation"> | Date | string
  }

  export type PasswordResetWhereInput = {
    AND?: PasswordResetWhereInput | PasswordResetWhereInput[]
    OR?: PasswordResetWhereInput[]
    NOT?: PasswordResetWhereInput | PasswordResetWhereInput[]
    id?: IntFilter<"PasswordReset"> | number
    userId?: IntFilter<"PasswordReset"> | number
    token?: StringFilter<"PasswordReset"> | string
    expiresAt?: DateTimeFilter<"PasswordReset"> | Date | string
    used?: BoolFilter<"PasswordReset"> | boolean
    createdAt?: DateTimeFilter<"PasswordReset"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type PasswordResetOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    used?: SortOrder
    createdAt?: SortOrder
    user?: UserOrderByWithRelationInput
    _relevance?: PasswordResetOrderByRelevanceInput
  }

  export type PasswordResetWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    token?: string
    AND?: PasswordResetWhereInput | PasswordResetWhereInput[]
    OR?: PasswordResetWhereInput[]
    NOT?: PasswordResetWhereInput | PasswordResetWhereInput[]
    userId?: IntFilter<"PasswordReset"> | number
    expiresAt?: DateTimeFilter<"PasswordReset"> | Date | string
    used?: BoolFilter<"PasswordReset"> | boolean
    createdAt?: DateTimeFilter<"PasswordReset"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "token">

  export type PasswordResetOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    used?: SortOrder
    createdAt?: SortOrder
    _count?: PasswordResetCountOrderByAggregateInput
    _avg?: PasswordResetAvgOrderByAggregateInput
    _max?: PasswordResetMaxOrderByAggregateInput
    _min?: PasswordResetMinOrderByAggregateInput
    _sum?: PasswordResetSumOrderByAggregateInput
  }

  export type PasswordResetScalarWhereWithAggregatesInput = {
    AND?: PasswordResetScalarWhereWithAggregatesInput | PasswordResetScalarWhereWithAggregatesInput[]
    OR?: PasswordResetScalarWhereWithAggregatesInput[]
    NOT?: PasswordResetScalarWhereWithAggregatesInput | PasswordResetScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"PasswordReset"> | number
    userId?: IntWithAggregatesFilter<"PasswordReset"> | number
    token?: StringWithAggregatesFilter<"PasswordReset"> | string
    expiresAt?: DateTimeWithAggregatesFilter<"PasswordReset"> | Date | string
    used?: BoolWithAggregatesFilter<"PasswordReset"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"PasswordReset"> | Date | string
  }

  export type RefreshTokenWhereInput = {
    AND?: RefreshTokenWhereInput | RefreshTokenWhereInput[]
    OR?: RefreshTokenWhereInput[]
    NOT?: RefreshTokenWhereInput | RefreshTokenWhereInput[]
    id?: IntFilter<"RefreshToken"> | number
    userId?: IntFilter<"RefreshToken"> | number
    token?: StringFilter<"RefreshToken"> | string
    expiresAt?: DateTimeFilter<"RefreshToken"> | Date | string
    createdAt?: DateTimeFilter<"RefreshToken"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type RefreshTokenOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    user?: UserOrderByWithRelationInput
    _relevance?: RefreshTokenOrderByRelevanceInput
  }

  export type RefreshTokenWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    token?: string
    AND?: RefreshTokenWhereInput | RefreshTokenWhereInput[]
    OR?: RefreshTokenWhereInput[]
    NOT?: RefreshTokenWhereInput | RefreshTokenWhereInput[]
    userId?: IntFilter<"RefreshToken"> | number
    expiresAt?: DateTimeFilter<"RefreshToken"> | Date | string
    createdAt?: DateTimeFilter<"RefreshToken"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "token">

  export type RefreshTokenOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    _count?: RefreshTokenCountOrderByAggregateInput
    _avg?: RefreshTokenAvgOrderByAggregateInput
    _max?: RefreshTokenMaxOrderByAggregateInput
    _min?: RefreshTokenMinOrderByAggregateInput
    _sum?: RefreshTokenSumOrderByAggregateInput
  }

  export type RefreshTokenScalarWhereWithAggregatesInput = {
    AND?: RefreshTokenScalarWhereWithAggregatesInput | RefreshTokenScalarWhereWithAggregatesInput[]
    OR?: RefreshTokenScalarWhereWithAggregatesInput[]
    NOT?: RefreshTokenScalarWhereWithAggregatesInput | RefreshTokenScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"RefreshToken"> | number
    userId?: IntWithAggregatesFilter<"RefreshToken"> | number
    token?: StringWithAggregatesFilter<"RefreshToken"> | string
    expiresAt?: DateTimeWithAggregatesFilter<"RefreshToken"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"RefreshToken"> | Date | string
  }

  export type eventsWhereInput = {
    AND?: eventsWhereInput | eventsWhereInput[]
    OR?: eventsWhereInput[]
    NOT?: eventsWhereInput | eventsWhereInput[]
    id?: IntFilter<"events"> | number
    userId?: IntFilter<"events"> | number
    title?: StringFilter<"events"> | string
    description?: StringNullableFilter<"events"> | string | null
    date?: DateTimeNullableFilter<"events"> | Date | string | null
    end_date?: DateTimeNullableFilter<"events"> | Date | string | null
    location?: StringNullableFilter<"events"> | string | null
    life_events?: Life_eventsListRelationFilter
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type eventsOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    date?: SortOrderInput | SortOrder
    end_date?: SortOrderInput | SortOrder
    location?: SortOrderInput | SortOrder
    life_events?: life_eventsOrderByRelationAggregateInput
    user?: UserOrderByWithRelationInput
    _relevance?: eventsOrderByRelevanceInput
  }

  export type eventsWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: eventsWhereInput | eventsWhereInput[]
    OR?: eventsWhereInput[]
    NOT?: eventsWhereInput | eventsWhereInput[]
    userId?: IntFilter<"events"> | number
    title?: StringFilter<"events"> | string
    description?: StringNullableFilter<"events"> | string | null
    date?: DateTimeNullableFilter<"events"> | Date | string | null
    end_date?: DateTimeNullableFilter<"events"> | Date | string | null
    location?: StringNullableFilter<"events"> | string | null
    life_events?: Life_eventsListRelationFilter
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type eventsOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    title?: SortOrder
    description?: SortOrderInput | SortOrder
    date?: SortOrderInput | SortOrder
    end_date?: SortOrderInput | SortOrder
    location?: SortOrderInput | SortOrder
    _count?: eventsCountOrderByAggregateInput
    _avg?: eventsAvgOrderByAggregateInput
    _max?: eventsMaxOrderByAggregateInput
    _min?: eventsMinOrderByAggregateInput
    _sum?: eventsSumOrderByAggregateInput
  }

  export type eventsScalarWhereWithAggregatesInput = {
    AND?: eventsScalarWhereWithAggregatesInput | eventsScalarWhereWithAggregatesInput[]
    OR?: eventsScalarWhereWithAggregatesInput[]
    NOT?: eventsScalarWhereWithAggregatesInput | eventsScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"events"> | number
    userId?: IntWithAggregatesFilter<"events"> | number
    title?: StringWithAggregatesFilter<"events"> | string
    description?: StringNullableWithAggregatesFilter<"events"> | string | null
    date?: DateTimeNullableWithAggregatesFilter<"events"> | Date | string | null
    end_date?: DateTimeNullableWithAggregatesFilter<"events"> | Date | string | null
    location?: StringNullableWithAggregatesFilter<"events"> | string | null
  }

  export type event_typesWhereInput = {
    AND?: event_typesWhereInput | event_typesWhereInput[]
    OR?: event_typesWhereInput[]
    NOT?: event_typesWhereInput | event_typesWhereInput[]
    id?: IntFilter<"event_types"> | number
    userId?: IntFilter<"event_types"> | number
    name?: StringNullableFilter<"event_types"> | string | null
    icon?: StringNullableFilter<"event_types"> | string | null
    color?: StringNullableFilter<"event_types"> | string | null
    life_events?: Life_eventsListRelationFilter
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type event_typesOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    name?: SortOrderInput | SortOrder
    icon?: SortOrderInput | SortOrder
    color?: SortOrderInput | SortOrder
    life_events?: life_eventsOrderByRelationAggregateInput
    user?: UserOrderByWithRelationInput
    _relevance?: event_typesOrderByRelevanceInput
  }

  export type event_typesWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: event_typesWhereInput | event_typesWhereInput[]
    OR?: event_typesWhereInput[]
    NOT?: event_typesWhereInput | event_typesWhereInput[]
    userId?: IntFilter<"event_types"> | number
    name?: StringNullableFilter<"event_types"> | string | null
    icon?: StringNullableFilter<"event_types"> | string | null
    color?: StringNullableFilter<"event_types"> | string | null
    life_events?: Life_eventsListRelationFilter
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type event_typesOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    name?: SortOrderInput | SortOrder
    icon?: SortOrderInput | SortOrder
    color?: SortOrderInput | SortOrder
    _count?: event_typesCountOrderByAggregateInput
    _avg?: event_typesAvgOrderByAggregateInput
    _max?: event_typesMaxOrderByAggregateInput
    _min?: event_typesMinOrderByAggregateInput
    _sum?: event_typesSumOrderByAggregateInput
  }

  export type event_typesScalarWhereWithAggregatesInput = {
    AND?: event_typesScalarWhereWithAggregatesInput | event_typesScalarWhereWithAggregatesInput[]
    OR?: event_typesScalarWhereWithAggregatesInput[]
    NOT?: event_typesScalarWhereWithAggregatesInput | event_typesScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"event_types"> | number
    userId?: IntWithAggregatesFilter<"event_types"> | number
    name?: StringNullableWithAggregatesFilter<"event_types"> | string | null
    icon?: StringNullableWithAggregatesFilter<"event_types"> | string | null
    color?: StringNullableWithAggregatesFilter<"event_types"> | string | null
  }

  export type life_eventsWhereInput = {
    AND?: life_eventsWhereInput | life_eventsWhereInput[]
    OR?: life_eventsWhereInput[]
    NOT?: life_eventsWhereInput | life_eventsWhereInput[]
    id?: IntFilter<"life_events"> | number
    userId?: IntFilter<"life_events"> | number
    person_id?: IntNullableFilter<"life_events"> | number | null
    event_id?: IntNullableFilter<"life_events"> | number | null
    title?: StringNullableFilter<"life_events"> | string | null
    start_date?: DateTimeNullableFilter<"life_events"> | Date | string | null
    end_date?: DateTimeNullableFilter<"life_events"> | Date | string | null
    location?: StringNullableFilter<"life_events"> | string | null
    description?: StringNullableFilter<"life_events"> | string | null
    metadata?: JsonNullableFilter<"life_events">
    event_type_id?: IntNullableFilter<"life_events"> | number | null
    event?: XOR<EventsNullableScalarRelationFilter, eventsWhereInput> | null
    event_type?: XOR<Event_typesNullableScalarRelationFilter, event_typesWhereInput> | null
    persons?: XOR<PersonsNullableScalarRelationFilter, personsWhereInput> | null
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type life_eventsOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    person_id?: SortOrderInput | SortOrder
    event_id?: SortOrderInput | SortOrder
    title?: SortOrderInput | SortOrder
    start_date?: SortOrderInput | SortOrder
    end_date?: SortOrderInput | SortOrder
    location?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    event_type_id?: SortOrderInput | SortOrder
    event?: eventsOrderByWithRelationInput
    event_type?: event_typesOrderByWithRelationInput
    persons?: personsOrderByWithRelationInput
    user?: UserOrderByWithRelationInput
    _relevance?: life_eventsOrderByRelevanceInput
  }

  export type life_eventsWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: life_eventsWhereInput | life_eventsWhereInput[]
    OR?: life_eventsWhereInput[]
    NOT?: life_eventsWhereInput | life_eventsWhereInput[]
    userId?: IntFilter<"life_events"> | number
    person_id?: IntNullableFilter<"life_events"> | number | null
    event_id?: IntNullableFilter<"life_events"> | number | null
    title?: StringNullableFilter<"life_events"> | string | null
    start_date?: DateTimeNullableFilter<"life_events"> | Date | string | null
    end_date?: DateTimeNullableFilter<"life_events"> | Date | string | null
    location?: StringNullableFilter<"life_events"> | string | null
    description?: StringNullableFilter<"life_events"> | string | null
    metadata?: JsonNullableFilter<"life_events">
    event_type_id?: IntNullableFilter<"life_events"> | number | null
    event?: XOR<EventsNullableScalarRelationFilter, eventsWhereInput> | null
    event_type?: XOR<Event_typesNullableScalarRelationFilter, event_typesWhereInput> | null
    persons?: XOR<PersonsNullableScalarRelationFilter, personsWhereInput> | null
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type life_eventsOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    person_id?: SortOrderInput | SortOrder
    event_id?: SortOrderInput | SortOrder
    title?: SortOrderInput | SortOrder
    start_date?: SortOrderInput | SortOrder
    end_date?: SortOrderInput | SortOrder
    location?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    metadata?: SortOrderInput | SortOrder
    event_type_id?: SortOrderInput | SortOrder
    _count?: life_eventsCountOrderByAggregateInput
    _avg?: life_eventsAvgOrderByAggregateInput
    _max?: life_eventsMaxOrderByAggregateInput
    _min?: life_eventsMinOrderByAggregateInput
    _sum?: life_eventsSumOrderByAggregateInput
  }

  export type life_eventsScalarWhereWithAggregatesInput = {
    AND?: life_eventsScalarWhereWithAggregatesInput | life_eventsScalarWhereWithAggregatesInput[]
    OR?: life_eventsScalarWhereWithAggregatesInput[]
    NOT?: life_eventsScalarWhereWithAggregatesInput | life_eventsScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"life_events"> | number
    userId?: IntWithAggregatesFilter<"life_events"> | number
    person_id?: IntNullableWithAggregatesFilter<"life_events"> | number | null
    event_id?: IntNullableWithAggregatesFilter<"life_events"> | number | null
    title?: StringNullableWithAggregatesFilter<"life_events"> | string | null
    start_date?: DateTimeNullableWithAggregatesFilter<"life_events"> | Date | string | null
    end_date?: DateTimeNullableWithAggregatesFilter<"life_events"> | Date | string | null
    location?: StringNullableWithAggregatesFilter<"life_events"> | string | null
    description?: StringNullableWithAggregatesFilter<"life_events"> | string | null
    metadata?: JsonNullableWithAggregatesFilter<"life_events">
    event_type_id?: IntNullableWithAggregatesFilter<"life_events"> | number | null
  }

  export type personsWhereInput = {
    AND?: personsWhereInput | personsWhereInput[]
    OR?: personsWhereInput[]
    NOT?: personsWhereInput | personsWhereInput[]
    id?: IntFilter<"persons"> | number
    userId?: IntFilter<"persons"> | number
    first_name?: StringNullableFilter<"persons"> | string | null
    last_name?: StringNullableFilter<"persons"> | string | null
    birth_date?: DateTimeNullableFilter<"persons"> | Date | string | null
    birth_place?: StringNullableFilter<"persons"> | string | null
    death_date?: DateTimeNullableFilter<"persons"> | Date | string | null
    death_place?: StringNullableFilter<"persons"> | string | null
    notes?: StringNullableFilter<"persons"> | string | null
    life_events?: Life_eventsListRelationFilter
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    relations_from?: Person_relationsListRelationFilter
    relations_to?: Person_relationsListRelationFilter
  }

  export type personsOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    first_name?: SortOrderInput | SortOrder
    last_name?: SortOrderInput | SortOrder
    birth_date?: SortOrderInput | SortOrder
    birth_place?: SortOrderInput | SortOrder
    death_date?: SortOrderInput | SortOrder
    death_place?: SortOrderInput | SortOrder
    notes?: SortOrderInput | SortOrder
    life_events?: life_eventsOrderByRelationAggregateInput
    user?: UserOrderByWithRelationInput
    relations_from?: person_relationsOrderByRelationAggregateInput
    relations_to?: person_relationsOrderByRelationAggregateInput
    _relevance?: personsOrderByRelevanceInput
  }

  export type personsWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: personsWhereInput | personsWhereInput[]
    OR?: personsWhereInput[]
    NOT?: personsWhereInput | personsWhereInput[]
    userId?: IntFilter<"persons"> | number
    first_name?: StringNullableFilter<"persons"> | string | null
    last_name?: StringNullableFilter<"persons"> | string | null
    birth_date?: DateTimeNullableFilter<"persons"> | Date | string | null
    birth_place?: StringNullableFilter<"persons"> | string | null
    death_date?: DateTimeNullableFilter<"persons"> | Date | string | null
    death_place?: StringNullableFilter<"persons"> | string | null
    notes?: StringNullableFilter<"persons"> | string | null
    life_events?: Life_eventsListRelationFilter
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    relations_from?: Person_relationsListRelationFilter
    relations_to?: Person_relationsListRelationFilter
  }, "id">

  export type personsOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    first_name?: SortOrderInput | SortOrder
    last_name?: SortOrderInput | SortOrder
    birth_date?: SortOrderInput | SortOrder
    birth_place?: SortOrderInput | SortOrder
    death_date?: SortOrderInput | SortOrder
    death_place?: SortOrderInput | SortOrder
    notes?: SortOrderInput | SortOrder
    _count?: personsCountOrderByAggregateInput
    _avg?: personsAvgOrderByAggregateInput
    _max?: personsMaxOrderByAggregateInput
    _min?: personsMinOrderByAggregateInput
    _sum?: personsSumOrderByAggregateInput
  }

  export type personsScalarWhereWithAggregatesInput = {
    AND?: personsScalarWhereWithAggregatesInput | personsScalarWhereWithAggregatesInput[]
    OR?: personsScalarWhereWithAggregatesInput[]
    NOT?: personsScalarWhereWithAggregatesInput | personsScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"persons"> | number
    userId?: IntWithAggregatesFilter<"persons"> | number
    first_name?: StringNullableWithAggregatesFilter<"persons"> | string | null
    last_name?: StringNullableWithAggregatesFilter<"persons"> | string | null
    birth_date?: DateTimeNullableWithAggregatesFilter<"persons"> | Date | string | null
    birth_place?: StringNullableWithAggregatesFilter<"persons"> | string | null
    death_date?: DateTimeNullableWithAggregatesFilter<"persons"> | Date | string | null
    death_place?: StringNullableWithAggregatesFilter<"persons"> | string | null
    notes?: StringNullableWithAggregatesFilter<"persons"> | string | null
  }

  export type person_relationsWhereInput = {
    AND?: person_relationsWhereInput | person_relationsWhereInput[]
    OR?: person_relationsWhereInput[]
    NOT?: person_relationsWhereInput | person_relationsWhereInput[]
    id?: IntFilter<"person_relations"> | number
    from_person_id?: IntFilter<"person_relations"> | number
    to_person_id?: IntFilter<"person_relations"> | number
    relation_type?: StringFilter<"person_relations"> | string
    notes?: StringNullableFilter<"person_relations"> | string | null
    from_person?: XOR<PersonsScalarRelationFilter, personsWhereInput>
    to_person?: XOR<PersonsScalarRelationFilter, personsWhereInput>
  }

  export type person_relationsOrderByWithRelationInput = {
    id?: SortOrder
    from_person_id?: SortOrder
    to_person_id?: SortOrder
    relation_type?: SortOrder
    notes?: SortOrderInput | SortOrder
    from_person?: personsOrderByWithRelationInput
    to_person?: personsOrderByWithRelationInput
    _relevance?: person_relationsOrderByRelevanceInput
  }

  export type person_relationsWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: person_relationsWhereInput | person_relationsWhereInput[]
    OR?: person_relationsWhereInput[]
    NOT?: person_relationsWhereInput | person_relationsWhereInput[]
    from_person_id?: IntFilter<"person_relations"> | number
    to_person_id?: IntFilter<"person_relations"> | number
    relation_type?: StringFilter<"person_relations"> | string
    notes?: StringNullableFilter<"person_relations"> | string | null
    from_person?: XOR<PersonsScalarRelationFilter, personsWhereInput>
    to_person?: XOR<PersonsScalarRelationFilter, personsWhereInput>
  }, "id">

  export type person_relationsOrderByWithAggregationInput = {
    id?: SortOrder
    from_person_id?: SortOrder
    to_person_id?: SortOrder
    relation_type?: SortOrder
    notes?: SortOrderInput | SortOrder
    _count?: person_relationsCountOrderByAggregateInput
    _avg?: person_relationsAvgOrderByAggregateInput
    _max?: person_relationsMaxOrderByAggregateInput
    _min?: person_relationsMinOrderByAggregateInput
    _sum?: person_relationsSumOrderByAggregateInput
  }

  export type person_relationsScalarWhereWithAggregatesInput = {
    AND?: person_relationsScalarWhereWithAggregatesInput | person_relationsScalarWhereWithAggregatesInput[]
    OR?: person_relationsScalarWhereWithAggregatesInput[]
    NOT?: person_relationsScalarWhereWithAggregatesInput | person_relationsScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"person_relations"> | number
    from_person_id?: IntWithAggregatesFilter<"person_relations"> | number
    to_person_id?: IntWithAggregatesFilter<"person_relations"> | number
    relation_type?: StringWithAggregatesFilter<"person_relations"> | string
    notes?: StringNullableWithAggregatesFilter<"person_relations"> | string | null
  }

  export type literatureWhereInput = {
    AND?: literatureWhereInput | literatureWhereInput[]
    OR?: literatureWhereInput[]
    NOT?: literatureWhereInput | literatureWhereInput[]
    id?: IntFilter<"literature"> | number
    userId?: IntFilter<"literature"> | number
    title?: StringFilter<"literature"> | string
    author?: StringFilter<"literature"> | string
    publicationYear?: IntNullableFilter<"literature"> | number | null
    type?: StringFilter<"literature"> | string
    description?: StringNullableFilter<"literature"> | string | null
    url?: StringNullableFilter<"literature"> | string | null
    publisher?: StringNullableFilter<"literature"> | string | null
    journal?: StringNullableFilter<"literature"> | string | null
    volume?: StringNullableFilter<"literature"> | string | null
    issue?: StringNullableFilter<"literature"> | string | null
    pages?: StringNullableFilter<"literature"> | string | null
    doi?: StringNullableFilter<"literature"> | string | null
    isbn?: StringNullableFilter<"literature"> | string | null
    issn?: StringNullableFilter<"literature"> | string | null
    language?: StringNullableFilter<"literature"> | string | null
    keywords?: StringNullableFilter<"literature"> | string | null
    abstract?: StringNullableFilter<"literature"> | string | null
    externalId?: StringNullableFilter<"literature"> | string | null
    syncSource?: StringNullableFilter<"literature"> | string | null
    lastSyncedAt?: DateTimeNullableFilter<"literature"> | Date | string | null
    syncMetadata?: JsonNullableFilter<"literature">
    createdAt?: DateTimeFilter<"literature"> | Date | string
    updatedAt?: DateTimeFilter<"literature"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type literatureOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    title?: SortOrder
    author?: SortOrder
    publicationYear?: SortOrderInput | SortOrder
    type?: SortOrder
    description?: SortOrderInput | SortOrder
    url?: SortOrderInput | SortOrder
    publisher?: SortOrderInput | SortOrder
    journal?: SortOrderInput | SortOrder
    volume?: SortOrderInput | SortOrder
    issue?: SortOrderInput | SortOrder
    pages?: SortOrderInput | SortOrder
    doi?: SortOrderInput | SortOrder
    isbn?: SortOrderInput | SortOrder
    issn?: SortOrderInput | SortOrder
    language?: SortOrderInput | SortOrder
    keywords?: SortOrderInput | SortOrder
    abstract?: SortOrderInput | SortOrder
    externalId?: SortOrderInput | SortOrder
    syncSource?: SortOrderInput | SortOrder
    lastSyncedAt?: SortOrderInput | SortOrder
    syncMetadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
    _relevance?: literatureOrderByRelevanceInput
  }

  export type literatureWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: literatureWhereInput | literatureWhereInput[]
    OR?: literatureWhereInput[]
    NOT?: literatureWhereInput | literatureWhereInput[]
    userId?: IntFilter<"literature"> | number
    title?: StringFilter<"literature"> | string
    author?: StringFilter<"literature"> | string
    publicationYear?: IntNullableFilter<"literature"> | number | null
    type?: StringFilter<"literature"> | string
    description?: StringNullableFilter<"literature"> | string | null
    url?: StringNullableFilter<"literature"> | string | null
    publisher?: StringNullableFilter<"literature"> | string | null
    journal?: StringNullableFilter<"literature"> | string | null
    volume?: StringNullableFilter<"literature"> | string | null
    issue?: StringNullableFilter<"literature"> | string | null
    pages?: StringNullableFilter<"literature"> | string | null
    doi?: StringNullableFilter<"literature"> | string | null
    isbn?: StringNullableFilter<"literature"> | string | null
    issn?: StringNullableFilter<"literature"> | string | null
    language?: StringNullableFilter<"literature"> | string | null
    keywords?: StringNullableFilter<"literature"> | string | null
    abstract?: StringNullableFilter<"literature"> | string | null
    externalId?: StringNullableFilter<"literature"> | string | null
    syncSource?: StringNullableFilter<"literature"> | string | null
    lastSyncedAt?: DateTimeNullableFilter<"literature"> | Date | string | null
    syncMetadata?: JsonNullableFilter<"literature">
    createdAt?: DateTimeFilter<"literature"> | Date | string
    updatedAt?: DateTimeFilter<"literature"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type literatureOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    title?: SortOrder
    author?: SortOrder
    publicationYear?: SortOrderInput | SortOrder
    type?: SortOrder
    description?: SortOrderInput | SortOrder
    url?: SortOrderInput | SortOrder
    publisher?: SortOrderInput | SortOrder
    journal?: SortOrderInput | SortOrder
    volume?: SortOrderInput | SortOrder
    issue?: SortOrderInput | SortOrder
    pages?: SortOrderInput | SortOrder
    doi?: SortOrderInput | SortOrder
    isbn?: SortOrderInput | SortOrder
    issn?: SortOrderInput | SortOrder
    language?: SortOrderInput | SortOrder
    keywords?: SortOrderInput | SortOrder
    abstract?: SortOrderInput | SortOrder
    externalId?: SortOrderInput | SortOrder
    syncSource?: SortOrderInput | SortOrder
    lastSyncedAt?: SortOrderInput | SortOrder
    syncMetadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: literatureCountOrderByAggregateInput
    _avg?: literatureAvgOrderByAggregateInput
    _max?: literatureMaxOrderByAggregateInput
    _min?: literatureMinOrderByAggregateInput
    _sum?: literatureSumOrderByAggregateInput
  }

  export type literatureScalarWhereWithAggregatesInput = {
    AND?: literatureScalarWhereWithAggregatesInput | literatureScalarWhereWithAggregatesInput[]
    OR?: literatureScalarWhereWithAggregatesInput[]
    NOT?: literatureScalarWhereWithAggregatesInput | literatureScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"literature"> | number
    userId?: IntWithAggregatesFilter<"literature"> | number
    title?: StringWithAggregatesFilter<"literature"> | string
    author?: StringWithAggregatesFilter<"literature"> | string
    publicationYear?: IntNullableWithAggregatesFilter<"literature"> | number | null
    type?: StringWithAggregatesFilter<"literature"> | string
    description?: StringNullableWithAggregatesFilter<"literature"> | string | null
    url?: StringNullableWithAggregatesFilter<"literature"> | string | null
    publisher?: StringNullableWithAggregatesFilter<"literature"> | string | null
    journal?: StringNullableWithAggregatesFilter<"literature"> | string | null
    volume?: StringNullableWithAggregatesFilter<"literature"> | string | null
    issue?: StringNullableWithAggregatesFilter<"literature"> | string | null
    pages?: StringNullableWithAggregatesFilter<"literature"> | string | null
    doi?: StringNullableWithAggregatesFilter<"literature"> | string | null
    isbn?: StringNullableWithAggregatesFilter<"literature"> | string | null
    issn?: StringNullableWithAggregatesFilter<"literature"> | string | null
    language?: StringNullableWithAggregatesFilter<"literature"> | string | null
    keywords?: StringNullableWithAggregatesFilter<"literature"> | string | null
    abstract?: StringNullableWithAggregatesFilter<"literature"> | string | null
    externalId?: StringNullableWithAggregatesFilter<"literature"> | string | null
    syncSource?: StringNullableWithAggregatesFilter<"literature"> | string | null
    lastSyncedAt?: DateTimeNullableWithAggregatesFilter<"literature"> | Date | string | null
    syncMetadata?: JsonNullableWithAggregatesFilter<"literature">
    createdAt?: DateTimeWithAggregatesFilter<"literature"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"literature"> | Date | string
  }

  export type BibliographySyncWhereInput = {
    AND?: BibliographySyncWhereInput | BibliographySyncWhereInput[]
    OR?: BibliographySyncWhereInput[]
    NOT?: BibliographySyncWhereInput | BibliographySyncWhereInput[]
    id?: IntFilter<"BibliographySync"> | number
    userId?: IntFilter<"BibliographySync"> | number
    service?: StringFilter<"BibliographySync"> | string
    name?: StringFilter<"BibliographySync"> | string
    isActive?: BoolFilter<"BibliographySync"> | boolean
    apiKey?: StringNullableFilter<"BibliographySync"> | string | null
    apiSecret?: StringNullableFilter<"BibliographySync"> | string | null
    accessToken?: StringNullableFilter<"BibliographySync"> | string | null
    refreshToken?: StringNullableFilter<"BibliographySync"> | string | null
    tokenExpiresAt?: DateTimeNullableFilter<"BibliographySync"> | Date | string | null
    collectionId?: StringNullableFilter<"BibliographySync"> | string | null
    collectionName?: StringNullableFilter<"BibliographySync"> | string | null
    autoSync?: BoolFilter<"BibliographySync"> | boolean
    syncInterval?: IntNullableFilter<"BibliographySync"> | number | null
    lastSyncAt?: DateTimeNullableFilter<"BibliographySync"> | Date | string | null
    syncMetadata?: JsonNullableFilter<"BibliographySync">
    createdAt?: DateTimeFilter<"BibliographySync"> | Date | string
    updatedAt?: DateTimeFilter<"BibliographySync"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type BibliographySyncOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    service?: SortOrder
    name?: SortOrder
    isActive?: SortOrder
    apiKey?: SortOrderInput | SortOrder
    apiSecret?: SortOrderInput | SortOrder
    accessToken?: SortOrderInput | SortOrder
    refreshToken?: SortOrderInput | SortOrder
    tokenExpiresAt?: SortOrderInput | SortOrder
    collectionId?: SortOrderInput | SortOrder
    collectionName?: SortOrderInput | SortOrder
    autoSync?: SortOrder
    syncInterval?: SortOrderInput | SortOrder
    lastSyncAt?: SortOrderInput | SortOrder
    syncMetadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
    _relevance?: BibliographySyncOrderByRelevanceInput
  }

  export type BibliographySyncWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: BibliographySyncWhereInput | BibliographySyncWhereInput[]
    OR?: BibliographySyncWhereInput[]
    NOT?: BibliographySyncWhereInput | BibliographySyncWhereInput[]
    userId?: IntFilter<"BibliographySync"> | number
    service?: StringFilter<"BibliographySync"> | string
    name?: StringFilter<"BibliographySync"> | string
    isActive?: BoolFilter<"BibliographySync"> | boolean
    apiKey?: StringNullableFilter<"BibliographySync"> | string | null
    apiSecret?: StringNullableFilter<"BibliographySync"> | string | null
    accessToken?: StringNullableFilter<"BibliographySync"> | string | null
    refreshToken?: StringNullableFilter<"BibliographySync"> | string | null
    tokenExpiresAt?: DateTimeNullableFilter<"BibliographySync"> | Date | string | null
    collectionId?: StringNullableFilter<"BibliographySync"> | string | null
    collectionName?: StringNullableFilter<"BibliographySync"> | string | null
    autoSync?: BoolFilter<"BibliographySync"> | boolean
    syncInterval?: IntNullableFilter<"BibliographySync"> | number | null
    lastSyncAt?: DateTimeNullableFilter<"BibliographySync"> | Date | string | null
    syncMetadata?: JsonNullableFilter<"BibliographySync">
    createdAt?: DateTimeFilter<"BibliographySync"> | Date | string
    updatedAt?: DateTimeFilter<"BibliographySync"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type BibliographySyncOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    service?: SortOrder
    name?: SortOrder
    isActive?: SortOrder
    apiKey?: SortOrderInput | SortOrder
    apiSecret?: SortOrderInput | SortOrder
    accessToken?: SortOrderInput | SortOrder
    refreshToken?: SortOrderInput | SortOrder
    tokenExpiresAt?: SortOrderInput | SortOrder
    collectionId?: SortOrderInput | SortOrder
    collectionName?: SortOrderInput | SortOrder
    autoSync?: SortOrder
    syncInterval?: SortOrderInput | SortOrder
    lastSyncAt?: SortOrderInput | SortOrder
    syncMetadata?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: BibliographySyncCountOrderByAggregateInput
    _avg?: BibliographySyncAvgOrderByAggregateInput
    _max?: BibliographySyncMaxOrderByAggregateInput
    _min?: BibliographySyncMinOrderByAggregateInput
    _sum?: BibliographySyncSumOrderByAggregateInput
  }

  export type BibliographySyncScalarWhereWithAggregatesInput = {
    AND?: BibliographySyncScalarWhereWithAggregatesInput | BibliographySyncScalarWhereWithAggregatesInput[]
    OR?: BibliographySyncScalarWhereWithAggregatesInput[]
    NOT?: BibliographySyncScalarWhereWithAggregatesInput | BibliographySyncScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"BibliographySync"> | number
    userId?: IntWithAggregatesFilter<"BibliographySync"> | number
    service?: StringWithAggregatesFilter<"BibliographySync"> | string
    name?: StringWithAggregatesFilter<"BibliographySync"> | string
    isActive?: BoolWithAggregatesFilter<"BibliographySync"> | boolean
    apiKey?: StringNullableWithAggregatesFilter<"BibliographySync"> | string | null
    apiSecret?: StringNullableWithAggregatesFilter<"BibliographySync"> | string | null
    accessToken?: StringNullableWithAggregatesFilter<"BibliographySync"> | string | null
    refreshToken?: StringNullableWithAggregatesFilter<"BibliographySync"> | string | null
    tokenExpiresAt?: DateTimeNullableWithAggregatesFilter<"BibliographySync"> | Date | string | null
    collectionId?: StringNullableWithAggregatesFilter<"BibliographySync"> | string | null
    collectionName?: StringNullableWithAggregatesFilter<"BibliographySync"> | string | null
    autoSync?: BoolWithAggregatesFilter<"BibliographySync"> | boolean
    syncInterval?: IntNullableWithAggregatesFilter<"BibliographySync"> | number | null
    lastSyncAt?: DateTimeNullableWithAggregatesFilter<"BibliographySync"> | Date | string | null
    syncMetadata?: JsonNullableWithAggregatesFilter<"BibliographySync">
    createdAt?: DateTimeWithAggregatesFilter<"BibliographySync"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"BibliographySync"> | Date | string
  }

  export type UserCreateInput = {
    email: string
    name: string
    password: string
    role?: $Enums.UserRole
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastLoginAt?: Date | string | null
    emailConfirmations?: EmailConfirmationCreateNestedManyWithoutUserInput
    passwordResets?: PasswordResetCreateNestedManyWithoutUserInput
    refreshTokens?: RefreshTokenCreateNestedManyWithoutUserInput
    events?: eventsCreateNestedManyWithoutUserInput
    persons?: personsCreateNestedManyWithoutUserInput
    life_events?: life_eventsCreateNestedManyWithoutUserInput
    event_types?: event_typesCreateNestedManyWithoutUserInput
    literature?: literatureCreateNestedManyWithoutUserInput
    bibliographySyncs?: BibliographySyncCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    id?: number
    email: string
    name: string
    password: string
    role?: $Enums.UserRole
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastLoginAt?: Date | string | null
    emailConfirmations?: EmailConfirmationUncheckedCreateNestedManyWithoutUserInput
    passwordResets?: PasswordResetUncheckedCreateNestedManyWithoutUserInput
    refreshTokens?: RefreshTokenUncheckedCreateNestedManyWithoutUserInput
    events?: eventsUncheckedCreateNestedManyWithoutUserInput
    persons?: personsUncheckedCreateNestedManyWithoutUserInput
    life_events?: life_eventsUncheckedCreateNestedManyWithoutUserInput
    event_types?: event_typesUncheckedCreateNestedManyWithoutUserInput
    literature?: literatureUncheckedCreateNestedManyWithoutUserInput
    bibliographySyncs?: BibliographySyncUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserUpdateInput = {
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailConfirmations?: EmailConfirmationUpdateManyWithoutUserNestedInput
    passwordResets?: PasswordResetUpdateManyWithoutUserNestedInput
    refreshTokens?: RefreshTokenUpdateManyWithoutUserNestedInput
    events?: eventsUpdateManyWithoutUserNestedInput
    persons?: personsUpdateManyWithoutUserNestedInput
    life_events?: life_eventsUpdateManyWithoutUserNestedInput
    event_types?: event_typesUpdateManyWithoutUserNestedInput
    literature?: literatureUpdateManyWithoutUserNestedInput
    bibliographySyncs?: BibliographySyncUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailConfirmations?: EmailConfirmationUncheckedUpdateManyWithoutUserNestedInput
    passwordResets?: PasswordResetUncheckedUpdateManyWithoutUserNestedInput
    refreshTokens?: RefreshTokenUncheckedUpdateManyWithoutUserNestedInput
    events?: eventsUncheckedUpdateManyWithoutUserNestedInput
    persons?: personsUncheckedUpdateManyWithoutUserNestedInput
    life_events?: life_eventsUncheckedUpdateManyWithoutUserNestedInput
    event_types?: event_typesUncheckedUpdateManyWithoutUserNestedInput
    literature?: literatureUncheckedUpdateManyWithoutUserNestedInput
    bibliographySyncs?: BibliographySyncUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    id?: number
    email: string
    name: string
    password: string
    role?: $Enums.UserRole
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastLoginAt?: Date | string | null
  }

  export type UserUpdateManyMutationInput = {
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type UserUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type EmailConfirmationCreateInput = {
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutEmailConfirmationsInput
  }

  export type EmailConfirmationUncheckedCreateInput = {
    id?: number
    userId: number
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type EmailConfirmationUpdateInput = {
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutEmailConfirmationsNestedInput
  }

  export type EmailConfirmationUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EmailConfirmationCreateManyInput = {
    id?: number
    userId: number
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type EmailConfirmationUpdateManyMutationInput = {
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EmailConfirmationUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PasswordResetCreateInput = {
    token: string
    expiresAt: Date | string
    used?: boolean
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutPasswordResetsInput
  }

  export type PasswordResetUncheckedCreateInput = {
    id?: number
    userId: number
    token: string
    expiresAt: Date | string
    used?: boolean
    createdAt?: Date | string
  }

  export type PasswordResetUpdateInput = {
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    used?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutPasswordResetsNestedInput
  }

  export type PasswordResetUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    used?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PasswordResetCreateManyInput = {
    id?: number
    userId: number
    token: string
    expiresAt: Date | string
    used?: boolean
    createdAt?: Date | string
  }

  export type PasswordResetUpdateManyMutationInput = {
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    used?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PasswordResetUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    used?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RefreshTokenCreateInput = {
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutRefreshTokensInput
  }

  export type RefreshTokenUncheckedCreateInput = {
    id?: number
    userId: number
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type RefreshTokenUpdateInput = {
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutRefreshTokensNestedInput
  }

  export type RefreshTokenUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RefreshTokenCreateManyInput = {
    id?: number
    userId: number
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type RefreshTokenUpdateManyMutationInput = {
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RefreshTokenUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type eventsCreateInput = {
    title: string
    description?: string | null
    date?: Date | string | null
    end_date?: Date | string | null
    location?: string | null
    life_events?: life_eventsCreateNestedManyWithoutEventInput
    user: UserCreateNestedOneWithoutEventsInput
  }

  export type eventsUncheckedCreateInput = {
    id?: number
    userId: number
    title: string
    description?: string | null
    date?: Date | string | null
    end_date?: Date | string | null
    location?: string | null
    life_events?: life_eventsUncheckedCreateNestedManyWithoutEventInput
  }

  export type eventsUpdateInput = {
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    life_events?: life_eventsUpdateManyWithoutEventNestedInput
    user?: UserUpdateOneRequiredWithoutEventsNestedInput
  }

  export type eventsUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    life_events?: life_eventsUncheckedUpdateManyWithoutEventNestedInput
  }

  export type eventsCreateManyInput = {
    id?: number
    userId: number
    title: string
    description?: string | null
    date?: Date | string | null
    end_date?: Date | string | null
    location?: string | null
  }

  export type eventsUpdateManyMutationInput = {
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type eventsUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type event_typesCreateInput = {
    name?: string | null
    icon?: string | null
    color?: string | null
    life_events?: life_eventsCreateNestedManyWithoutEvent_typeInput
    user: UserCreateNestedOneWithoutEvent_typesInput
  }

  export type event_typesUncheckedCreateInput = {
    id?: number
    userId: number
    name?: string | null
    icon?: string | null
    color?: string | null
    life_events?: life_eventsUncheckedCreateNestedManyWithoutEvent_typeInput
  }

  export type event_typesUpdateInput = {
    name?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    life_events?: life_eventsUpdateManyWithoutEvent_typeNestedInput
    user?: UserUpdateOneRequiredWithoutEvent_typesNestedInput
  }

  export type event_typesUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    name?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    life_events?: life_eventsUncheckedUpdateManyWithoutEvent_typeNestedInput
  }

  export type event_typesCreateManyInput = {
    id?: number
    userId: number
    name?: string | null
    icon?: string | null
    color?: string | null
  }

  export type event_typesUpdateManyMutationInput = {
    name?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type event_typesUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    name?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type life_eventsCreateInput = {
    title?: string | null
    start_date?: Date | string | null
    end_date?: Date | string | null
    location?: string | null
    description?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    event?: eventsCreateNestedOneWithoutLife_eventsInput
    event_type?: event_typesCreateNestedOneWithoutLife_eventsInput
    persons?: personsCreateNestedOneWithoutLife_eventsInput
    user: UserCreateNestedOneWithoutLife_eventsInput
  }

  export type life_eventsUncheckedCreateInput = {
    id?: number
    userId: number
    person_id?: number | null
    event_id?: number | null
    title?: string | null
    start_date?: Date | string | null
    end_date?: Date | string | null
    location?: string | null
    description?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    event_type_id?: number | null
  }

  export type life_eventsUpdateInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null
    start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    event?: eventsUpdateOneWithoutLife_eventsNestedInput
    event_type?: event_typesUpdateOneWithoutLife_eventsNestedInput
    persons?: personsUpdateOneWithoutLife_eventsNestedInput
    user?: UserUpdateOneRequiredWithoutLife_eventsNestedInput
  }

  export type life_eventsUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    person_id?: NullableIntFieldUpdateOperationsInput | number | null
    event_id?: NullableIntFieldUpdateOperationsInput | number | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    event_type_id?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type life_eventsCreateManyInput = {
    id?: number
    userId: number
    person_id?: number | null
    event_id?: number | null
    title?: string | null
    start_date?: Date | string | null
    end_date?: Date | string | null
    location?: string | null
    description?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    event_type_id?: number | null
  }

  export type life_eventsUpdateManyMutationInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null
    start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type life_eventsUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    person_id?: NullableIntFieldUpdateOperationsInput | number | null
    event_id?: NullableIntFieldUpdateOperationsInput | number | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    event_type_id?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type personsCreateInput = {
    first_name?: string | null
    last_name?: string | null
    birth_date?: Date | string | null
    birth_place?: string | null
    death_date?: Date | string | null
    death_place?: string | null
    notes?: string | null
    life_events?: life_eventsCreateNestedManyWithoutPersonsInput
    user: UserCreateNestedOneWithoutPersonsInput
    relations_from?: person_relationsCreateNestedManyWithoutFrom_personInput
    relations_to?: person_relationsCreateNestedManyWithoutTo_personInput
  }

  export type personsUncheckedCreateInput = {
    id?: number
    userId: number
    first_name?: string | null
    last_name?: string | null
    birth_date?: Date | string | null
    birth_place?: string | null
    death_date?: Date | string | null
    death_place?: string | null
    notes?: string | null
    life_events?: life_eventsUncheckedCreateNestedManyWithoutPersonsInput
    relations_from?: person_relationsUncheckedCreateNestedManyWithoutFrom_personInput
    relations_to?: person_relationsUncheckedCreateNestedManyWithoutTo_personInput
  }

  export type personsUpdateInput = {
    first_name?: NullableStringFieldUpdateOperationsInput | string | null
    last_name?: NullableStringFieldUpdateOperationsInput | string | null
    birth_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    birth_place?: NullableStringFieldUpdateOperationsInput | string | null
    death_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    death_place?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    life_events?: life_eventsUpdateManyWithoutPersonsNestedInput
    user?: UserUpdateOneRequiredWithoutPersonsNestedInput
    relations_from?: person_relationsUpdateManyWithoutFrom_personNestedInput
    relations_to?: person_relationsUpdateManyWithoutTo_personNestedInput
  }

  export type personsUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    first_name?: NullableStringFieldUpdateOperationsInput | string | null
    last_name?: NullableStringFieldUpdateOperationsInput | string | null
    birth_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    birth_place?: NullableStringFieldUpdateOperationsInput | string | null
    death_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    death_place?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    life_events?: life_eventsUncheckedUpdateManyWithoutPersonsNestedInput
    relations_from?: person_relationsUncheckedUpdateManyWithoutFrom_personNestedInput
    relations_to?: person_relationsUncheckedUpdateManyWithoutTo_personNestedInput
  }

  export type personsCreateManyInput = {
    id?: number
    userId: number
    first_name?: string | null
    last_name?: string | null
    birth_date?: Date | string | null
    birth_place?: string | null
    death_date?: Date | string | null
    death_place?: string | null
    notes?: string | null
  }

  export type personsUpdateManyMutationInput = {
    first_name?: NullableStringFieldUpdateOperationsInput | string | null
    last_name?: NullableStringFieldUpdateOperationsInput | string | null
    birth_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    birth_place?: NullableStringFieldUpdateOperationsInput | string | null
    death_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    death_place?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type personsUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    first_name?: NullableStringFieldUpdateOperationsInput | string | null
    last_name?: NullableStringFieldUpdateOperationsInput | string | null
    birth_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    birth_place?: NullableStringFieldUpdateOperationsInput | string | null
    death_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    death_place?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type person_relationsCreateInput = {
    relation_type: string
    notes?: string | null
    from_person: personsCreateNestedOneWithoutRelations_fromInput
    to_person: personsCreateNestedOneWithoutRelations_toInput
  }

  export type person_relationsUncheckedCreateInput = {
    id?: number
    from_person_id: number
    to_person_id: number
    relation_type: string
    notes?: string | null
  }

  export type person_relationsUpdateInput = {
    relation_type?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    from_person?: personsUpdateOneRequiredWithoutRelations_fromNestedInput
    to_person?: personsUpdateOneRequiredWithoutRelations_toNestedInput
  }

  export type person_relationsUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    from_person_id?: IntFieldUpdateOperationsInput | number
    to_person_id?: IntFieldUpdateOperationsInput | number
    relation_type?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type person_relationsCreateManyInput = {
    id?: number
    from_person_id: number
    to_person_id: number
    relation_type: string
    notes?: string | null
  }

  export type person_relationsUpdateManyMutationInput = {
    relation_type?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type person_relationsUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    from_person_id?: IntFieldUpdateOperationsInput | number
    to_person_id?: IntFieldUpdateOperationsInput | number
    relation_type?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type literatureCreateInput = {
    title: string
    author: string
    publicationYear?: number | null
    type: string
    description?: string | null
    url?: string | null
    publisher?: string | null
    journal?: string | null
    volume?: string | null
    issue?: string | null
    pages?: string | null
    doi?: string | null
    isbn?: string | null
    issn?: string | null
    language?: string | null
    keywords?: string | null
    abstract?: string | null
    externalId?: string | null
    syncSource?: string | null
    lastSyncedAt?: Date | string | null
    syncMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutLiteratureInput
  }

  export type literatureUncheckedCreateInput = {
    id?: number
    userId: number
    title: string
    author: string
    publicationYear?: number | null
    type: string
    description?: string | null
    url?: string | null
    publisher?: string | null
    journal?: string | null
    volume?: string | null
    issue?: string | null
    pages?: string | null
    doi?: string | null
    isbn?: string | null
    issn?: string | null
    language?: string | null
    keywords?: string | null
    abstract?: string | null
    externalId?: string | null
    syncSource?: string | null
    lastSyncedAt?: Date | string | null
    syncMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type literatureUpdateInput = {
    title?: StringFieldUpdateOperationsInput | string
    author?: StringFieldUpdateOperationsInput | string
    publicationYear?: NullableIntFieldUpdateOperationsInput | number | null
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    url?: NullableStringFieldUpdateOperationsInput | string | null
    publisher?: NullableStringFieldUpdateOperationsInput | string | null
    journal?: NullableStringFieldUpdateOperationsInput | string | null
    volume?: NullableStringFieldUpdateOperationsInput | string | null
    issue?: NullableStringFieldUpdateOperationsInput | string | null
    pages?: NullableStringFieldUpdateOperationsInput | string | null
    doi?: NullableStringFieldUpdateOperationsInput | string | null
    isbn?: NullableStringFieldUpdateOperationsInput | string | null
    issn?: NullableStringFieldUpdateOperationsInput | string | null
    language?: NullableStringFieldUpdateOperationsInput | string | null
    keywords?: NullableStringFieldUpdateOperationsInput | string | null
    abstract?: NullableStringFieldUpdateOperationsInput | string | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    syncSource?: NullableStringFieldUpdateOperationsInput | string | null
    lastSyncedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    syncMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutLiteratureNestedInput
  }

  export type literatureUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    author?: StringFieldUpdateOperationsInput | string
    publicationYear?: NullableIntFieldUpdateOperationsInput | number | null
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    url?: NullableStringFieldUpdateOperationsInput | string | null
    publisher?: NullableStringFieldUpdateOperationsInput | string | null
    journal?: NullableStringFieldUpdateOperationsInput | string | null
    volume?: NullableStringFieldUpdateOperationsInput | string | null
    issue?: NullableStringFieldUpdateOperationsInput | string | null
    pages?: NullableStringFieldUpdateOperationsInput | string | null
    doi?: NullableStringFieldUpdateOperationsInput | string | null
    isbn?: NullableStringFieldUpdateOperationsInput | string | null
    issn?: NullableStringFieldUpdateOperationsInput | string | null
    language?: NullableStringFieldUpdateOperationsInput | string | null
    keywords?: NullableStringFieldUpdateOperationsInput | string | null
    abstract?: NullableStringFieldUpdateOperationsInput | string | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    syncSource?: NullableStringFieldUpdateOperationsInput | string | null
    lastSyncedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    syncMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type literatureCreateManyInput = {
    id?: number
    userId: number
    title: string
    author: string
    publicationYear?: number | null
    type: string
    description?: string | null
    url?: string | null
    publisher?: string | null
    journal?: string | null
    volume?: string | null
    issue?: string | null
    pages?: string | null
    doi?: string | null
    isbn?: string | null
    issn?: string | null
    language?: string | null
    keywords?: string | null
    abstract?: string | null
    externalId?: string | null
    syncSource?: string | null
    lastSyncedAt?: Date | string | null
    syncMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type literatureUpdateManyMutationInput = {
    title?: StringFieldUpdateOperationsInput | string
    author?: StringFieldUpdateOperationsInput | string
    publicationYear?: NullableIntFieldUpdateOperationsInput | number | null
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    url?: NullableStringFieldUpdateOperationsInput | string | null
    publisher?: NullableStringFieldUpdateOperationsInput | string | null
    journal?: NullableStringFieldUpdateOperationsInput | string | null
    volume?: NullableStringFieldUpdateOperationsInput | string | null
    issue?: NullableStringFieldUpdateOperationsInput | string | null
    pages?: NullableStringFieldUpdateOperationsInput | string | null
    doi?: NullableStringFieldUpdateOperationsInput | string | null
    isbn?: NullableStringFieldUpdateOperationsInput | string | null
    issn?: NullableStringFieldUpdateOperationsInput | string | null
    language?: NullableStringFieldUpdateOperationsInput | string | null
    keywords?: NullableStringFieldUpdateOperationsInput | string | null
    abstract?: NullableStringFieldUpdateOperationsInput | string | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    syncSource?: NullableStringFieldUpdateOperationsInput | string | null
    lastSyncedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    syncMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type literatureUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    author?: StringFieldUpdateOperationsInput | string
    publicationYear?: NullableIntFieldUpdateOperationsInput | number | null
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    url?: NullableStringFieldUpdateOperationsInput | string | null
    publisher?: NullableStringFieldUpdateOperationsInput | string | null
    journal?: NullableStringFieldUpdateOperationsInput | string | null
    volume?: NullableStringFieldUpdateOperationsInput | string | null
    issue?: NullableStringFieldUpdateOperationsInput | string | null
    pages?: NullableStringFieldUpdateOperationsInput | string | null
    doi?: NullableStringFieldUpdateOperationsInput | string | null
    isbn?: NullableStringFieldUpdateOperationsInput | string | null
    issn?: NullableStringFieldUpdateOperationsInput | string | null
    language?: NullableStringFieldUpdateOperationsInput | string | null
    keywords?: NullableStringFieldUpdateOperationsInput | string | null
    abstract?: NullableStringFieldUpdateOperationsInput | string | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    syncSource?: NullableStringFieldUpdateOperationsInput | string | null
    lastSyncedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    syncMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BibliographySyncCreateInput = {
    service: string
    name: string
    isActive?: boolean
    apiKey?: string | null
    apiSecret?: string | null
    accessToken?: string | null
    refreshToken?: string | null
    tokenExpiresAt?: Date | string | null
    collectionId?: string | null
    collectionName?: string | null
    autoSync?: boolean
    syncInterval?: number | null
    lastSyncAt?: Date | string | null
    syncMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutBibliographySyncsInput
  }

  export type BibliographySyncUncheckedCreateInput = {
    id?: number
    userId: number
    service: string
    name: string
    isActive?: boolean
    apiKey?: string | null
    apiSecret?: string | null
    accessToken?: string | null
    refreshToken?: string | null
    tokenExpiresAt?: Date | string | null
    collectionId?: string | null
    collectionName?: string | null
    autoSync?: boolean
    syncInterval?: number | null
    lastSyncAt?: Date | string | null
    syncMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BibliographySyncUpdateInput = {
    service?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    apiKey?: NullableStringFieldUpdateOperationsInput | string | null
    apiSecret?: NullableStringFieldUpdateOperationsInput | string | null
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    refreshToken?: NullableStringFieldUpdateOperationsInput | string | null
    tokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    collectionId?: NullableStringFieldUpdateOperationsInput | string | null
    collectionName?: NullableStringFieldUpdateOperationsInput | string | null
    autoSync?: BoolFieldUpdateOperationsInput | boolean
    syncInterval?: NullableIntFieldUpdateOperationsInput | number | null
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    syncMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutBibliographySyncsNestedInput
  }

  export type BibliographySyncUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    service?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    apiKey?: NullableStringFieldUpdateOperationsInput | string | null
    apiSecret?: NullableStringFieldUpdateOperationsInput | string | null
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    refreshToken?: NullableStringFieldUpdateOperationsInput | string | null
    tokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    collectionId?: NullableStringFieldUpdateOperationsInput | string | null
    collectionName?: NullableStringFieldUpdateOperationsInput | string | null
    autoSync?: BoolFieldUpdateOperationsInput | boolean
    syncInterval?: NullableIntFieldUpdateOperationsInput | number | null
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    syncMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BibliographySyncCreateManyInput = {
    id?: number
    userId: number
    service: string
    name: string
    isActive?: boolean
    apiKey?: string | null
    apiSecret?: string | null
    accessToken?: string | null
    refreshToken?: string | null
    tokenExpiresAt?: Date | string | null
    collectionId?: string | null
    collectionName?: string | null
    autoSync?: boolean
    syncInterval?: number | null
    lastSyncAt?: Date | string | null
    syncMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BibliographySyncUpdateManyMutationInput = {
    service?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    apiKey?: NullableStringFieldUpdateOperationsInput | string | null
    apiSecret?: NullableStringFieldUpdateOperationsInput | string | null
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    refreshToken?: NullableStringFieldUpdateOperationsInput | string | null
    tokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    collectionId?: NullableStringFieldUpdateOperationsInput | string | null
    collectionName?: NullableStringFieldUpdateOperationsInput | string | null
    autoSync?: BoolFieldUpdateOperationsInput | boolean
    syncInterval?: NullableIntFieldUpdateOperationsInput | number | null
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    syncMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BibliographySyncUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    service?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    apiKey?: NullableStringFieldUpdateOperationsInput | string | null
    apiSecret?: NullableStringFieldUpdateOperationsInput | string | null
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    refreshToken?: NullableStringFieldUpdateOperationsInput | string | null
    tokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    collectionId?: NullableStringFieldUpdateOperationsInput | string | null
    collectionName?: NullableStringFieldUpdateOperationsInput | string | null
    autoSync?: BoolFieldUpdateOperationsInput | boolean
    syncInterval?: NullableIntFieldUpdateOperationsInput | number | null
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    syncMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type EnumUserRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[]
    notIn?: $Enums.UserRole[]
    not?: NestedEnumUserRoleFilter<$PrismaModel> | $Enums.UserRole
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type EmailConfirmationListRelationFilter = {
    every?: EmailConfirmationWhereInput
    some?: EmailConfirmationWhereInput
    none?: EmailConfirmationWhereInput
  }

  export type PasswordResetListRelationFilter = {
    every?: PasswordResetWhereInput
    some?: PasswordResetWhereInput
    none?: PasswordResetWhereInput
  }

  export type RefreshTokenListRelationFilter = {
    every?: RefreshTokenWhereInput
    some?: RefreshTokenWhereInput
    none?: RefreshTokenWhereInput
  }

  export type EventsListRelationFilter = {
    every?: eventsWhereInput
    some?: eventsWhereInput
    none?: eventsWhereInput
  }

  export type PersonsListRelationFilter = {
    every?: personsWhereInput
    some?: personsWhereInput
    none?: personsWhereInput
  }

  export type Life_eventsListRelationFilter = {
    every?: life_eventsWhereInput
    some?: life_eventsWhereInput
    none?: life_eventsWhereInput
  }

  export type Event_typesListRelationFilter = {
    every?: event_typesWhereInput
    some?: event_typesWhereInput
    none?: event_typesWhereInput
  }

  export type LiteratureListRelationFilter = {
    every?: literatureWhereInput
    some?: literatureWhereInput
    none?: literatureWhereInput
  }

  export type BibliographySyncListRelationFilter = {
    every?: BibliographySyncWhereInput
    some?: BibliographySyncWhereInput
    none?: BibliographySyncWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type EmailConfirmationOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PasswordResetOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type RefreshTokenOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type eventsOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type personsOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type life_eventsOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type event_typesOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type literatureOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type BibliographySyncOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserOrderByRelevanceInput = {
    fields: UserOrderByRelevanceFieldEnum | UserOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    password?: SortOrder
    role?: SortOrder
    emailVerified?: SortOrder
    emailVerifiedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lastLoginAt?: SortOrder
  }

  export type UserAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    password?: SortOrder
    role?: SortOrder
    emailVerified?: SortOrder
    emailVerifiedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lastLoginAt?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    name?: SortOrder
    password?: SortOrder
    role?: SortOrder
    emailVerified?: SortOrder
    emailVerifiedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lastLoginAt?: SortOrder
  }

  export type UserSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type EnumUserRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[]
    notIn?: $Enums.UserRole[]
    not?: NestedEnumUserRoleWithAggregatesFilter<$PrismaModel> | $Enums.UserRole
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumUserRoleFilter<$PrismaModel>
    _max?: NestedEnumUserRoleFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type EmailConfirmationOrderByRelevanceInput = {
    fields: EmailConfirmationOrderByRelevanceFieldEnum | EmailConfirmationOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type EmailConfirmationCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
  }

  export type EmailConfirmationAvgOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
  }

  export type EmailConfirmationMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
  }

  export type EmailConfirmationMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
  }

  export type EmailConfirmationSumOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
  }

  export type PasswordResetOrderByRelevanceInput = {
    fields: PasswordResetOrderByRelevanceFieldEnum | PasswordResetOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type PasswordResetCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    used?: SortOrder
    createdAt?: SortOrder
  }

  export type PasswordResetAvgOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
  }

  export type PasswordResetMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    used?: SortOrder
    createdAt?: SortOrder
  }

  export type PasswordResetMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    used?: SortOrder
    createdAt?: SortOrder
  }

  export type PasswordResetSumOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
  }

  export type RefreshTokenOrderByRelevanceInput = {
    fields: RefreshTokenOrderByRelevanceFieldEnum | RefreshTokenOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type RefreshTokenCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
  }

  export type RefreshTokenAvgOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
  }

  export type RefreshTokenMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
  }

  export type RefreshTokenMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
  }

  export type RefreshTokenSumOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type eventsOrderByRelevanceInput = {
    fields: eventsOrderByRelevanceFieldEnum | eventsOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type eventsCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    title?: SortOrder
    description?: SortOrder
    date?: SortOrder
    end_date?: SortOrder
    location?: SortOrder
  }

  export type eventsAvgOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
  }

  export type eventsMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    title?: SortOrder
    description?: SortOrder
    date?: SortOrder
    end_date?: SortOrder
    location?: SortOrder
  }

  export type eventsMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    title?: SortOrder
    description?: SortOrder
    date?: SortOrder
    end_date?: SortOrder
    location?: SortOrder
  }

  export type eventsSumOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type event_typesOrderByRelevanceInput = {
    fields: event_typesOrderByRelevanceFieldEnum | event_typesOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type event_typesCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    name?: SortOrder
    icon?: SortOrder
    color?: SortOrder
  }

  export type event_typesAvgOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
  }

  export type event_typesMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    name?: SortOrder
    icon?: SortOrder
    color?: SortOrder
  }

  export type event_typesMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    name?: SortOrder
    icon?: SortOrder
    color?: SortOrder
  }

  export type event_typesSumOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue
    lte?: InputJsonValue
    gt?: InputJsonValue
    gte?: InputJsonValue
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type EventsNullableScalarRelationFilter = {
    is?: eventsWhereInput | null
    isNot?: eventsWhereInput | null
  }

  export type Event_typesNullableScalarRelationFilter = {
    is?: event_typesWhereInput | null
    isNot?: event_typesWhereInput | null
  }

  export type PersonsNullableScalarRelationFilter = {
    is?: personsWhereInput | null
    isNot?: personsWhereInput | null
  }

  export type life_eventsOrderByRelevanceInput = {
    fields: life_eventsOrderByRelevanceFieldEnum | life_eventsOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type life_eventsCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    person_id?: SortOrder
    event_id?: SortOrder
    title?: SortOrder
    start_date?: SortOrder
    end_date?: SortOrder
    location?: SortOrder
    description?: SortOrder
    metadata?: SortOrder
    event_type_id?: SortOrder
  }

  export type life_eventsAvgOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    person_id?: SortOrder
    event_id?: SortOrder
    event_type_id?: SortOrder
  }

  export type life_eventsMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    person_id?: SortOrder
    event_id?: SortOrder
    title?: SortOrder
    start_date?: SortOrder
    end_date?: SortOrder
    location?: SortOrder
    description?: SortOrder
    event_type_id?: SortOrder
  }

  export type life_eventsMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    person_id?: SortOrder
    event_id?: SortOrder
    title?: SortOrder
    start_date?: SortOrder
    end_date?: SortOrder
    location?: SortOrder
    description?: SortOrder
    event_type_id?: SortOrder
  }

  export type life_eventsSumOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    person_id?: SortOrder
    event_id?: SortOrder
    event_type_id?: SortOrder
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue
    lte?: InputJsonValue
    gt?: InputJsonValue
    gte?: InputJsonValue
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type Person_relationsListRelationFilter = {
    every?: person_relationsWhereInput
    some?: person_relationsWhereInput
    none?: person_relationsWhereInput
  }

  export type person_relationsOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type personsOrderByRelevanceInput = {
    fields: personsOrderByRelevanceFieldEnum | personsOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type personsCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    first_name?: SortOrder
    last_name?: SortOrder
    birth_date?: SortOrder
    birth_place?: SortOrder
    death_date?: SortOrder
    death_place?: SortOrder
    notes?: SortOrder
  }

  export type personsAvgOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
  }

  export type personsMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    first_name?: SortOrder
    last_name?: SortOrder
    birth_date?: SortOrder
    birth_place?: SortOrder
    death_date?: SortOrder
    death_place?: SortOrder
    notes?: SortOrder
  }

  export type personsMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    first_name?: SortOrder
    last_name?: SortOrder
    birth_date?: SortOrder
    birth_place?: SortOrder
    death_date?: SortOrder
    death_place?: SortOrder
    notes?: SortOrder
  }

  export type personsSumOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
  }

  export type PersonsScalarRelationFilter = {
    is?: personsWhereInput
    isNot?: personsWhereInput
  }

  export type person_relationsOrderByRelevanceInput = {
    fields: person_relationsOrderByRelevanceFieldEnum | person_relationsOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type person_relationsCountOrderByAggregateInput = {
    id?: SortOrder
    from_person_id?: SortOrder
    to_person_id?: SortOrder
    relation_type?: SortOrder
    notes?: SortOrder
  }

  export type person_relationsAvgOrderByAggregateInput = {
    id?: SortOrder
    from_person_id?: SortOrder
    to_person_id?: SortOrder
  }

  export type person_relationsMaxOrderByAggregateInput = {
    id?: SortOrder
    from_person_id?: SortOrder
    to_person_id?: SortOrder
    relation_type?: SortOrder
    notes?: SortOrder
  }

  export type person_relationsMinOrderByAggregateInput = {
    id?: SortOrder
    from_person_id?: SortOrder
    to_person_id?: SortOrder
    relation_type?: SortOrder
    notes?: SortOrder
  }

  export type person_relationsSumOrderByAggregateInput = {
    id?: SortOrder
    from_person_id?: SortOrder
    to_person_id?: SortOrder
  }

  export type literatureOrderByRelevanceInput = {
    fields: literatureOrderByRelevanceFieldEnum | literatureOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type literatureCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    title?: SortOrder
    author?: SortOrder
    publicationYear?: SortOrder
    type?: SortOrder
    description?: SortOrder
    url?: SortOrder
    publisher?: SortOrder
    journal?: SortOrder
    volume?: SortOrder
    issue?: SortOrder
    pages?: SortOrder
    doi?: SortOrder
    isbn?: SortOrder
    issn?: SortOrder
    language?: SortOrder
    keywords?: SortOrder
    abstract?: SortOrder
    externalId?: SortOrder
    syncSource?: SortOrder
    lastSyncedAt?: SortOrder
    syncMetadata?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type literatureAvgOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    publicationYear?: SortOrder
  }

  export type literatureMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    title?: SortOrder
    author?: SortOrder
    publicationYear?: SortOrder
    type?: SortOrder
    description?: SortOrder
    url?: SortOrder
    publisher?: SortOrder
    journal?: SortOrder
    volume?: SortOrder
    issue?: SortOrder
    pages?: SortOrder
    doi?: SortOrder
    isbn?: SortOrder
    issn?: SortOrder
    language?: SortOrder
    keywords?: SortOrder
    abstract?: SortOrder
    externalId?: SortOrder
    syncSource?: SortOrder
    lastSyncedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type literatureMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    title?: SortOrder
    author?: SortOrder
    publicationYear?: SortOrder
    type?: SortOrder
    description?: SortOrder
    url?: SortOrder
    publisher?: SortOrder
    journal?: SortOrder
    volume?: SortOrder
    issue?: SortOrder
    pages?: SortOrder
    doi?: SortOrder
    isbn?: SortOrder
    issn?: SortOrder
    language?: SortOrder
    keywords?: SortOrder
    abstract?: SortOrder
    externalId?: SortOrder
    syncSource?: SortOrder
    lastSyncedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type literatureSumOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    publicationYear?: SortOrder
  }

  export type BibliographySyncOrderByRelevanceInput = {
    fields: BibliographySyncOrderByRelevanceFieldEnum | BibliographySyncOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type BibliographySyncCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    service?: SortOrder
    name?: SortOrder
    isActive?: SortOrder
    apiKey?: SortOrder
    apiSecret?: SortOrder
    accessToken?: SortOrder
    refreshToken?: SortOrder
    tokenExpiresAt?: SortOrder
    collectionId?: SortOrder
    collectionName?: SortOrder
    autoSync?: SortOrder
    syncInterval?: SortOrder
    lastSyncAt?: SortOrder
    syncMetadata?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BibliographySyncAvgOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    syncInterval?: SortOrder
  }

  export type BibliographySyncMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    service?: SortOrder
    name?: SortOrder
    isActive?: SortOrder
    apiKey?: SortOrder
    apiSecret?: SortOrder
    accessToken?: SortOrder
    refreshToken?: SortOrder
    tokenExpiresAt?: SortOrder
    collectionId?: SortOrder
    collectionName?: SortOrder
    autoSync?: SortOrder
    syncInterval?: SortOrder
    lastSyncAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BibliographySyncMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    service?: SortOrder
    name?: SortOrder
    isActive?: SortOrder
    apiKey?: SortOrder
    apiSecret?: SortOrder
    accessToken?: SortOrder
    refreshToken?: SortOrder
    tokenExpiresAt?: SortOrder
    collectionId?: SortOrder
    collectionName?: SortOrder
    autoSync?: SortOrder
    syncInterval?: SortOrder
    lastSyncAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BibliographySyncSumOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    syncInterval?: SortOrder
  }

  export type EmailConfirmationCreateNestedManyWithoutUserInput = {
    create?: XOR<EmailConfirmationCreateWithoutUserInput, EmailConfirmationUncheckedCreateWithoutUserInput> | EmailConfirmationCreateWithoutUserInput[] | EmailConfirmationUncheckedCreateWithoutUserInput[]
    connectOrCreate?: EmailConfirmationCreateOrConnectWithoutUserInput | EmailConfirmationCreateOrConnectWithoutUserInput[]
    createMany?: EmailConfirmationCreateManyUserInputEnvelope
    connect?: EmailConfirmationWhereUniqueInput | EmailConfirmationWhereUniqueInput[]
  }

  export type PasswordResetCreateNestedManyWithoutUserInput = {
    create?: XOR<PasswordResetCreateWithoutUserInput, PasswordResetUncheckedCreateWithoutUserInput> | PasswordResetCreateWithoutUserInput[] | PasswordResetUncheckedCreateWithoutUserInput[]
    connectOrCreate?: PasswordResetCreateOrConnectWithoutUserInput | PasswordResetCreateOrConnectWithoutUserInput[]
    createMany?: PasswordResetCreateManyUserInputEnvelope
    connect?: PasswordResetWhereUniqueInput | PasswordResetWhereUniqueInput[]
  }

  export type RefreshTokenCreateNestedManyWithoutUserInput = {
    create?: XOR<RefreshTokenCreateWithoutUserInput, RefreshTokenUncheckedCreateWithoutUserInput> | RefreshTokenCreateWithoutUserInput[] | RefreshTokenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RefreshTokenCreateOrConnectWithoutUserInput | RefreshTokenCreateOrConnectWithoutUserInput[]
    createMany?: RefreshTokenCreateManyUserInputEnvelope
    connect?: RefreshTokenWhereUniqueInput | RefreshTokenWhereUniqueInput[]
  }

  export type eventsCreateNestedManyWithoutUserInput = {
    create?: XOR<eventsCreateWithoutUserInput, eventsUncheckedCreateWithoutUserInput> | eventsCreateWithoutUserInput[] | eventsUncheckedCreateWithoutUserInput[]
    connectOrCreate?: eventsCreateOrConnectWithoutUserInput | eventsCreateOrConnectWithoutUserInput[]
    createMany?: eventsCreateManyUserInputEnvelope
    connect?: eventsWhereUniqueInput | eventsWhereUniqueInput[]
  }

  export type personsCreateNestedManyWithoutUserInput = {
    create?: XOR<personsCreateWithoutUserInput, personsUncheckedCreateWithoutUserInput> | personsCreateWithoutUserInput[] | personsUncheckedCreateWithoutUserInput[]
    connectOrCreate?: personsCreateOrConnectWithoutUserInput | personsCreateOrConnectWithoutUserInput[]
    createMany?: personsCreateManyUserInputEnvelope
    connect?: personsWhereUniqueInput | personsWhereUniqueInput[]
  }

  export type life_eventsCreateNestedManyWithoutUserInput = {
    create?: XOR<life_eventsCreateWithoutUserInput, life_eventsUncheckedCreateWithoutUserInput> | life_eventsCreateWithoutUserInput[] | life_eventsUncheckedCreateWithoutUserInput[]
    connectOrCreate?: life_eventsCreateOrConnectWithoutUserInput | life_eventsCreateOrConnectWithoutUserInput[]
    createMany?: life_eventsCreateManyUserInputEnvelope
    connect?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
  }

  export type event_typesCreateNestedManyWithoutUserInput = {
    create?: XOR<event_typesCreateWithoutUserInput, event_typesUncheckedCreateWithoutUserInput> | event_typesCreateWithoutUserInput[] | event_typesUncheckedCreateWithoutUserInput[]
    connectOrCreate?: event_typesCreateOrConnectWithoutUserInput | event_typesCreateOrConnectWithoutUserInput[]
    createMany?: event_typesCreateManyUserInputEnvelope
    connect?: event_typesWhereUniqueInput | event_typesWhereUniqueInput[]
  }

  export type literatureCreateNestedManyWithoutUserInput = {
    create?: XOR<literatureCreateWithoutUserInput, literatureUncheckedCreateWithoutUserInput> | literatureCreateWithoutUserInput[] | literatureUncheckedCreateWithoutUserInput[]
    connectOrCreate?: literatureCreateOrConnectWithoutUserInput | literatureCreateOrConnectWithoutUserInput[]
    createMany?: literatureCreateManyUserInputEnvelope
    connect?: literatureWhereUniqueInput | literatureWhereUniqueInput[]
  }

  export type BibliographySyncCreateNestedManyWithoutUserInput = {
    create?: XOR<BibliographySyncCreateWithoutUserInput, BibliographySyncUncheckedCreateWithoutUserInput> | BibliographySyncCreateWithoutUserInput[] | BibliographySyncUncheckedCreateWithoutUserInput[]
    connectOrCreate?: BibliographySyncCreateOrConnectWithoutUserInput | BibliographySyncCreateOrConnectWithoutUserInput[]
    createMany?: BibliographySyncCreateManyUserInputEnvelope
    connect?: BibliographySyncWhereUniqueInput | BibliographySyncWhereUniqueInput[]
  }

  export type EmailConfirmationUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<EmailConfirmationCreateWithoutUserInput, EmailConfirmationUncheckedCreateWithoutUserInput> | EmailConfirmationCreateWithoutUserInput[] | EmailConfirmationUncheckedCreateWithoutUserInput[]
    connectOrCreate?: EmailConfirmationCreateOrConnectWithoutUserInput | EmailConfirmationCreateOrConnectWithoutUserInput[]
    createMany?: EmailConfirmationCreateManyUserInputEnvelope
    connect?: EmailConfirmationWhereUniqueInput | EmailConfirmationWhereUniqueInput[]
  }

  export type PasswordResetUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<PasswordResetCreateWithoutUserInput, PasswordResetUncheckedCreateWithoutUserInput> | PasswordResetCreateWithoutUserInput[] | PasswordResetUncheckedCreateWithoutUserInput[]
    connectOrCreate?: PasswordResetCreateOrConnectWithoutUserInput | PasswordResetCreateOrConnectWithoutUserInput[]
    createMany?: PasswordResetCreateManyUserInputEnvelope
    connect?: PasswordResetWhereUniqueInput | PasswordResetWhereUniqueInput[]
  }

  export type RefreshTokenUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<RefreshTokenCreateWithoutUserInput, RefreshTokenUncheckedCreateWithoutUserInput> | RefreshTokenCreateWithoutUserInput[] | RefreshTokenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RefreshTokenCreateOrConnectWithoutUserInput | RefreshTokenCreateOrConnectWithoutUserInput[]
    createMany?: RefreshTokenCreateManyUserInputEnvelope
    connect?: RefreshTokenWhereUniqueInput | RefreshTokenWhereUniqueInput[]
  }

  export type eventsUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<eventsCreateWithoutUserInput, eventsUncheckedCreateWithoutUserInput> | eventsCreateWithoutUserInput[] | eventsUncheckedCreateWithoutUserInput[]
    connectOrCreate?: eventsCreateOrConnectWithoutUserInput | eventsCreateOrConnectWithoutUserInput[]
    createMany?: eventsCreateManyUserInputEnvelope
    connect?: eventsWhereUniqueInput | eventsWhereUniqueInput[]
  }

  export type personsUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<personsCreateWithoutUserInput, personsUncheckedCreateWithoutUserInput> | personsCreateWithoutUserInput[] | personsUncheckedCreateWithoutUserInput[]
    connectOrCreate?: personsCreateOrConnectWithoutUserInput | personsCreateOrConnectWithoutUserInput[]
    createMany?: personsCreateManyUserInputEnvelope
    connect?: personsWhereUniqueInput | personsWhereUniqueInput[]
  }

  export type life_eventsUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<life_eventsCreateWithoutUserInput, life_eventsUncheckedCreateWithoutUserInput> | life_eventsCreateWithoutUserInput[] | life_eventsUncheckedCreateWithoutUserInput[]
    connectOrCreate?: life_eventsCreateOrConnectWithoutUserInput | life_eventsCreateOrConnectWithoutUserInput[]
    createMany?: life_eventsCreateManyUserInputEnvelope
    connect?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
  }

  export type event_typesUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<event_typesCreateWithoutUserInput, event_typesUncheckedCreateWithoutUserInput> | event_typesCreateWithoutUserInput[] | event_typesUncheckedCreateWithoutUserInput[]
    connectOrCreate?: event_typesCreateOrConnectWithoutUserInput | event_typesCreateOrConnectWithoutUserInput[]
    createMany?: event_typesCreateManyUserInputEnvelope
    connect?: event_typesWhereUniqueInput | event_typesWhereUniqueInput[]
  }

  export type literatureUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<literatureCreateWithoutUserInput, literatureUncheckedCreateWithoutUserInput> | literatureCreateWithoutUserInput[] | literatureUncheckedCreateWithoutUserInput[]
    connectOrCreate?: literatureCreateOrConnectWithoutUserInput | literatureCreateOrConnectWithoutUserInput[]
    createMany?: literatureCreateManyUserInputEnvelope
    connect?: literatureWhereUniqueInput | literatureWhereUniqueInput[]
  }

  export type BibliographySyncUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<BibliographySyncCreateWithoutUserInput, BibliographySyncUncheckedCreateWithoutUserInput> | BibliographySyncCreateWithoutUserInput[] | BibliographySyncUncheckedCreateWithoutUserInput[]
    connectOrCreate?: BibliographySyncCreateOrConnectWithoutUserInput | BibliographySyncCreateOrConnectWithoutUserInput[]
    createMany?: BibliographySyncCreateManyUserInputEnvelope
    connect?: BibliographySyncWhereUniqueInput | BibliographySyncWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type EnumUserRoleFieldUpdateOperationsInput = {
    set?: $Enums.UserRole
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type EmailConfirmationUpdateManyWithoutUserNestedInput = {
    create?: XOR<EmailConfirmationCreateWithoutUserInput, EmailConfirmationUncheckedCreateWithoutUserInput> | EmailConfirmationCreateWithoutUserInput[] | EmailConfirmationUncheckedCreateWithoutUserInput[]
    connectOrCreate?: EmailConfirmationCreateOrConnectWithoutUserInput | EmailConfirmationCreateOrConnectWithoutUserInput[]
    upsert?: EmailConfirmationUpsertWithWhereUniqueWithoutUserInput | EmailConfirmationUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: EmailConfirmationCreateManyUserInputEnvelope
    set?: EmailConfirmationWhereUniqueInput | EmailConfirmationWhereUniqueInput[]
    disconnect?: EmailConfirmationWhereUniqueInput | EmailConfirmationWhereUniqueInput[]
    delete?: EmailConfirmationWhereUniqueInput | EmailConfirmationWhereUniqueInput[]
    connect?: EmailConfirmationWhereUniqueInput | EmailConfirmationWhereUniqueInput[]
    update?: EmailConfirmationUpdateWithWhereUniqueWithoutUserInput | EmailConfirmationUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: EmailConfirmationUpdateManyWithWhereWithoutUserInput | EmailConfirmationUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: EmailConfirmationScalarWhereInput | EmailConfirmationScalarWhereInput[]
  }

  export type PasswordResetUpdateManyWithoutUserNestedInput = {
    create?: XOR<PasswordResetCreateWithoutUserInput, PasswordResetUncheckedCreateWithoutUserInput> | PasswordResetCreateWithoutUserInput[] | PasswordResetUncheckedCreateWithoutUserInput[]
    connectOrCreate?: PasswordResetCreateOrConnectWithoutUserInput | PasswordResetCreateOrConnectWithoutUserInput[]
    upsert?: PasswordResetUpsertWithWhereUniqueWithoutUserInput | PasswordResetUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: PasswordResetCreateManyUserInputEnvelope
    set?: PasswordResetWhereUniqueInput | PasswordResetWhereUniqueInput[]
    disconnect?: PasswordResetWhereUniqueInput | PasswordResetWhereUniqueInput[]
    delete?: PasswordResetWhereUniqueInput | PasswordResetWhereUniqueInput[]
    connect?: PasswordResetWhereUniqueInput | PasswordResetWhereUniqueInput[]
    update?: PasswordResetUpdateWithWhereUniqueWithoutUserInput | PasswordResetUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: PasswordResetUpdateManyWithWhereWithoutUserInput | PasswordResetUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: PasswordResetScalarWhereInput | PasswordResetScalarWhereInput[]
  }

  export type RefreshTokenUpdateManyWithoutUserNestedInput = {
    create?: XOR<RefreshTokenCreateWithoutUserInput, RefreshTokenUncheckedCreateWithoutUserInput> | RefreshTokenCreateWithoutUserInput[] | RefreshTokenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RefreshTokenCreateOrConnectWithoutUserInput | RefreshTokenCreateOrConnectWithoutUserInput[]
    upsert?: RefreshTokenUpsertWithWhereUniqueWithoutUserInput | RefreshTokenUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: RefreshTokenCreateManyUserInputEnvelope
    set?: RefreshTokenWhereUniqueInput | RefreshTokenWhereUniqueInput[]
    disconnect?: RefreshTokenWhereUniqueInput | RefreshTokenWhereUniqueInput[]
    delete?: RefreshTokenWhereUniqueInput | RefreshTokenWhereUniqueInput[]
    connect?: RefreshTokenWhereUniqueInput | RefreshTokenWhereUniqueInput[]
    update?: RefreshTokenUpdateWithWhereUniqueWithoutUserInput | RefreshTokenUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: RefreshTokenUpdateManyWithWhereWithoutUserInput | RefreshTokenUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: RefreshTokenScalarWhereInput | RefreshTokenScalarWhereInput[]
  }

  export type eventsUpdateManyWithoutUserNestedInput = {
    create?: XOR<eventsCreateWithoutUserInput, eventsUncheckedCreateWithoutUserInput> | eventsCreateWithoutUserInput[] | eventsUncheckedCreateWithoutUserInput[]
    connectOrCreate?: eventsCreateOrConnectWithoutUserInput | eventsCreateOrConnectWithoutUserInput[]
    upsert?: eventsUpsertWithWhereUniqueWithoutUserInput | eventsUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: eventsCreateManyUserInputEnvelope
    set?: eventsWhereUniqueInput | eventsWhereUniqueInput[]
    disconnect?: eventsWhereUniqueInput | eventsWhereUniqueInput[]
    delete?: eventsWhereUniqueInput | eventsWhereUniqueInput[]
    connect?: eventsWhereUniqueInput | eventsWhereUniqueInput[]
    update?: eventsUpdateWithWhereUniqueWithoutUserInput | eventsUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: eventsUpdateManyWithWhereWithoutUserInput | eventsUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: eventsScalarWhereInput | eventsScalarWhereInput[]
  }

  export type personsUpdateManyWithoutUserNestedInput = {
    create?: XOR<personsCreateWithoutUserInput, personsUncheckedCreateWithoutUserInput> | personsCreateWithoutUserInput[] | personsUncheckedCreateWithoutUserInput[]
    connectOrCreate?: personsCreateOrConnectWithoutUserInput | personsCreateOrConnectWithoutUserInput[]
    upsert?: personsUpsertWithWhereUniqueWithoutUserInput | personsUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: personsCreateManyUserInputEnvelope
    set?: personsWhereUniqueInput | personsWhereUniqueInput[]
    disconnect?: personsWhereUniqueInput | personsWhereUniqueInput[]
    delete?: personsWhereUniqueInput | personsWhereUniqueInput[]
    connect?: personsWhereUniqueInput | personsWhereUniqueInput[]
    update?: personsUpdateWithWhereUniqueWithoutUserInput | personsUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: personsUpdateManyWithWhereWithoutUserInput | personsUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: personsScalarWhereInput | personsScalarWhereInput[]
  }

  export type life_eventsUpdateManyWithoutUserNestedInput = {
    create?: XOR<life_eventsCreateWithoutUserInput, life_eventsUncheckedCreateWithoutUserInput> | life_eventsCreateWithoutUserInput[] | life_eventsUncheckedCreateWithoutUserInput[]
    connectOrCreate?: life_eventsCreateOrConnectWithoutUserInput | life_eventsCreateOrConnectWithoutUserInput[]
    upsert?: life_eventsUpsertWithWhereUniqueWithoutUserInput | life_eventsUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: life_eventsCreateManyUserInputEnvelope
    set?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
    disconnect?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
    delete?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
    connect?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
    update?: life_eventsUpdateWithWhereUniqueWithoutUserInput | life_eventsUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: life_eventsUpdateManyWithWhereWithoutUserInput | life_eventsUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: life_eventsScalarWhereInput | life_eventsScalarWhereInput[]
  }

  export type event_typesUpdateManyWithoutUserNestedInput = {
    create?: XOR<event_typesCreateWithoutUserInput, event_typesUncheckedCreateWithoutUserInput> | event_typesCreateWithoutUserInput[] | event_typesUncheckedCreateWithoutUserInput[]
    connectOrCreate?: event_typesCreateOrConnectWithoutUserInput | event_typesCreateOrConnectWithoutUserInput[]
    upsert?: event_typesUpsertWithWhereUniqueWithoutUserInput | event_typesUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: event_typesCreateManyUserInputEnvelope
    set?: event_typesWhereUniqueInput | event_typesWhereUniqueInput[]
    disconnect?: event_typesWhereUniqueInput | event_typesWhereUniqueInput[]
    delete?: event_typesWhereUniqueInput | event_typesWhereUniqueInput[]
    connect?: event_typesWhereUniqueInput | event_typesWhereUniqueInput[]
    update?: event_typesUpdateWithWhereUniqueWithoutUserInput | event_typesUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: event_typesUpdateManyWithWhereWithoutUserInput | event_typesUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: event_typesScalarWhereInput | event_typesScalarWhereInput[]
  }

  export type literatureUpdateManyWithoutUserNestedInput = {
    create?: XOR<literatureCreateWithoutUserInput, literatureUncheckedCreateWithoutUserInput> | literatureCreateWithoutUserInput[] | literatureUncheckedCreateWithoutUserInput[]
    connectOrCreate?: literatureCreateOrConnectWithoutUserInput | literatureCreateOrConnectWithoutUserInput[]
    upsert?: literatureUpsertWithWhereUniqueWithoutUserInput | literatureUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: literatureCreateManyUserInputEnvelope
    set?: literatureWhereUniqueInput | literatureWhereUniqueInput[]
    disconnect?: literatureWhereUniqueInput | literatureWhereUniqueInput[]
    delete?: literatureWhereUniqueInput | literatureWhereUniqueInput[]
    connect?: literatureWhereUniqueInput | literatureWhereUniqueInput[]
    update?: literatureUpdateWithWhereUniqueWithoutUserInput | literatureUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: literatureUpdateManyWithWhereWithoutUserInput | literatureUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: literatureScalarWhereInput | literatureScalarWhereInput[]
  }

  export type BibliographySyncUpdateManyWithoutUserNestedInput = {
    create?: XOR<BibliographySyncCreateWithoutUserInput, BibliographySyncUncheckedCreateWithoutUserInput> | BibliographySyncCreateWithoutUserInput[] | BibliographySyncUncheckedCreateWithoutUserInput[]
    connectOrCreate?: BibliographySyncCreateOrConnectWithoutUserInput | BibliographySyncCreateOrConnectWithoutUserInput[]
    upsert?: BibliographySyncUpsertWithWhereUniqueWithoutUserInput | BibliographySyncUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: BibliographySyncCreateManyUserInputEnvelope
    set?: BibliographySyncWhereUniqueInput | BibliographySyncWhereUniqueInput[]
    disconnect?: BibliographySyncWhereUniqueInput | BibliographySyncWhereUniqueInput[]
    delete?: BibliographySyncWhereUniqueInput | BibliographySyncWhereUniqueInput[]
    connect?: BibliographySyncWhereUniqueInput | BibliographySyncWhereUniqueInput[]
    update?: BibliographySyncUpdateWithWhereUniqueWithoutUserInput | BibliographySyncUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: BibliographySyncUpdateManyWithWhereWithoutUserInput | BibliographySyncUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: BibliographySyncScalarWhereInput | BibliographySyncScalarWhereInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type EmailConfirmationUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<EmailConfirmationCreateWithoutUserInput, EmailConfirmationUncheckedCreateWithoutUserInput> | EmailConfirmationCreateWithoutUserInput[] | EmailConfirmationUncheckedCreateWithoutUserInput[]
    connectOrCreate?: EmailConfirmationCreateOrConnectWithoutUserInput | EmailConfirmationCreateOrConnectWithoutUserInput[]
    upsert?: EmailConfirmationUpsertWithWhereUniqueWithoutUserInput | EmailConfirmationUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: EmailConfirmationCreateManyUserInputEnvelope
    set?: EmailConfirmationWhereUniqueInput | EmailConfirmationWhereUniqueInput[]
    disconnect?: EmailConfirmationWhereUniqueInput | EmailConfirmationWhereUniqueInput[]
    delete?: EmailConfirmationWhereUniqueInput | EmailConfirmationWhereUniqueInput[]
    connect?: EmailConfirmationWhereUniqueInput | EmailConfirmationWhereUniqueInput[]
    update?: EmailConfirmationUpdateWithWhereUniqueWithoutUserInput | EmailConfirmationUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: EmailConfirmationUpdateManyWithWhereWithoutUserInput | EmailConfirmationUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: EmailConfirmationScalarWhereInput | EmailConfirmationScalarWhereInput[]
  }

  export type PasswordResetUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<PasswordResetCreateWithoutUserInput, PasswordResetUncheckedCreateWithoutUserInput> | PasswordResetCreateWithoutUserInput[] | PasswordResetUncheckedCreateWithoutUserInput[]
    connectOrCreate?: PasswordResetCreateOrConnectWithoutUserInput | PasswordResetCreateOrConnectWithoutUserInput[]
    upsert?: PasswordResetUpsertWithWhereUniqueWithoutUserInput | PasswordResetUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: PasswordResetCreateManyUserInputEnvelope
    set?: PasswordResetWhereUniqueInput | PasswordResetWhereUniqueInput[]
    disconnect?: PasswordResetWhereUniqueInput | PasswordResetWhereUniqueInput[]
    delete?: PasswordResetWhereUniqueInput | PasswordResetWhereUniqueInput[]
    connect?: PasswordResetWhereUniqueInput | PasswordResetWhereUniqueInput[]
    update?: PasswordResetUpdateWithWhereUniqueWithoutUserInput | PasswordResetUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: PasswordResetUpdateManyWithWhereWithoutUserInput | PasswordResetUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: PasswordResetScalarWhereInput | PasswordResetScalarWhereInput[]
  }

  export type RefreshTokenUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<RefreshTokenCreateWithoutUserInput, RefreshTokenUncheckedCreateWithoutUserInput> | RefreshTokenCreateWithoutUserInput[] | RefreshTokenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RefreshTokenCreateOrConnectWithoutUserInput | RefreshTokenCreateOrConnectWithoutUserInput[]
    upsert?: RefreshTokenUpsertWithWhereUniqueWithoutUserInput | RefreshTokenUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: RefreshTokenCreateManyUserInputEnvelope
    set?: RefreshTokenWhereUniqueInput | RefreshTokenWhereUniqueInput[]
    disconnect?: RefreshTokenWhereUniqueInput | RefreshTokenWhereUniqueInput[]
    delete?: RefreshTokenWhereUniqueInput | RefreshTokenWhereUniqueInput[]
    connect?: RefreshTokenWhereUniqueInput | RefreshTokenWhereUniqueInput[]
    update?: RefreshTokenUpdateWithWhereUniqueWithoutUserInput | RefreshTokenUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: RefreshTokenUpdateManyWithWhereWithoutUserInput | RefreshTokenUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: RefreshTokenScalarWhereInput | RefreshTokenScalarWhereInput[]
  }

  export type eventsUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<eventsCreateWithoutUserInput, eventsUncheckedCreateWithoutUserInput> | eventsCreateWithoutUserInput[] | eventsUncheckedCreateWithoutUserInput[]
    connectOrCreate?: eventsCreateOrConnectWithoutUserInput | eventsCreateOrConnectWithoutUserInput[]
    upsert?: eventsUpsertWithWhereUniqueWithoutUserInput | eventsUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: eventsCreateManyUserInputEnvelope
    set?: eventsWhereUniqueInput | eventsWhereUniqueInput[]
    disconnect?: eventsWhereUniqueInput | eventsWhereUniqueInput[]
    delete?: eventsWhereUniqueInput | eventsWhereUniqueInput[]
    connect?: eventsWhereUniqueInput | eventsWhereUniqueInput[]
    update?: eventsUpdateWithWhereUniqueWithoutUserInput | eventsUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: eventsUpdateManyWithWhereWithoutUserInput | eventsUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: eventsScalarWhereInput | eventsScalarWhereInput[]
  }

  export type personsUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<personsCreateWithoutUserInput, personsUncheckedCreateWithoutUserInput> | personsCreateWithoutUserInput[] | personsUncheckedCreateWithoutUserInput[]
    connectOrCreate?: personsCreateOrConnectWithoutUserInput | personsCreateOrConnectWithoutUserInput[]
    upsert?: personsUpsertWithWhereUniqueWithoutUserInput | personsUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: personsCreateManyUserInputEnvelope
    set?: personsWhereUniqueInput | personsWhereUniqueInput[]
    disconnect?: personsWhereUniqueInput | personsWhereUniqueInput[]
    delete?: personsWhereUniqueInput | personsWhereUniqueInput[]
    connect?: personsWhereUniqueInput | personsWhereUniqueInput[]
    update?: personsUpdateWithWhereUniqueWithoutUserInput | personsUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: personsUpdateManyWithWhereWithoutUserInput | personsUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: personsScalarWhereInput | personsScalarWhereInput[]
  }

  export type life_eventsUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<life_eventsCreateWithoutUserInput, life_eventsUncheckedCreateWithoutUserInput> | life_eventsCreateWithoutUserInput[] | life_eventsUncheckedCreateWithoutUserInput[]
    connectOrCreate?: life_eventsCreateOrConnectWithoutUserInput | life_eventsCreateOrConnectWithoutUserInput[]
    upsert?: life_eventsUpsertWithWhereUniqueWithoutUserInput | life_eventsUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: life_eventsCreateManyUserInputEnvelope
    set?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
    disconnect?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
    delete?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
    connect?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
    update?: life_eventsUpdateWithWhereUniqueWithoutUserInput | life_eventsUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: life_eventsUpdateManyWithWhereWithoutUserInput | life_eventsUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: life_eventsScalarWhereInput | life_eventsScalarWhereInput[]
  }

  export type event_typesUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<event_typesCreateWithoutUserInput, event_typesUncheckedCreateWithoutUserInput> | event_typesCreateWithoutUserInput[] | event_typesUncheckedCreateWithoutUserInput[]
    connectOrCreate?: event_typesCreateOrConnectWithoutUserInput | event_typesCreateOrConnectWithoutUserInput[]
    upsert?: event_typesUpsertWithWhereUniqueWithoutUserInput | event_typesUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: event_typesCreateManyUserInputEnvelope
    set?: event_typesWhereUniqueInput | event_typesWhereUniqueInput[]
    disconnect?: event_typesWhereUniqueInput | event_typesWhereUniqueInput[]
    delete?: event_typesWhereUniqueInput | event_typesWhereUniqueInput[]
    connect?: event_typesWhereUniqueInput | event_typesWhereUniqueInput[]
    update?: event_typesUpdateWithWhereUniqueWithoutUserInput | event_typesUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: event_typesUpdateManyWithWhereWithoutUserInput | event_typesUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: event_typesScalarWhereInput | event_typesScalarWhereInput[]
  }

  export type literatureUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<literatureCreateWithoutUserInput, literatureUncheckedCreateWithoutUserInput> | literatureCreateWithoutUserInput[] | literatureUncheckedCreateWithoutUserInput[]
    connectOrCreate?: literatureCreateOrConnectWithoutUserInput | literatureCreateOrConnectWithoutUserInput[]
    upsert?: literatureUpsertWithWhereUniqueWithoutUserInput | literatureUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: literatureCreateManyUserInputEnvelope
    set?: literatureWhereUniqueInput | literatureWhereUniqueInput[]
    disconnect?: literatureWhereUniqueInput | literatureWhereUniqueInput[]
    delete?: literatureWhereUniqueInput | literatureWhereUniqueInput[]
    connect?: literatureWhereUniqueInput | literatureWhereUniqueInput[]
    update?: literatureUpdateWithWhereUniqueWithoutUserInput | literatureUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: literatureUpdateManyWithWhereWithoutUserInput | literatureUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: literatureScalarWhereInput | literatureScalarWhereInput[]
  }

  export type BibliographySyncUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<BibliographySyncCreateWithoutUserInput, BibliographySyncUncheckedCreateWithoutUserInput> | BibliographySyncCreateWithoutUserInput[] | BibliographySyncUncheckedCreateWithoutUserInput[]
    connectOrCreate?: BibliographySyncCreateOrConnectWithoutUserInput | BibliographySyncCreateOrConnectWithoutUserInput[]
    upsert?: BibliographySyncUpsertWithWhereUniqueWithoutUserInput | BibliographySyncUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: BibliographySyncCreateManyUserInputEnvelope
    set?: BibliographySyncWhereUniqueInput | BibliographySyncWhereUniqueInput[]
    disconnect?: BibliographySyncWhereUniqueInput | BibliographySyncWhereUniqueInput[]
    delete?: BibliographySyncWhereUniqueInput | BibliographySyncWhereUniqueInput[]
    connect?: BibliographySyncWhereUniqueInput | BibliographySyncWhereUniqueInput[]
    update?: BibliographySyncUpdateWithWhereUniqueWithoutUserInput | BibliographySyncUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: BibliographySyncUpdateManyWithWhereWithoutUserInput | BibliographySyncUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: BibliographySyncScalarWhereInput | BibliographySyncScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutEmailConfirmationsInput = {
    create?: XOR<UserCreateWithoutEmailConfirmationsInput, UserUncheckedCreateWithoutEmailConfirmationsInput>
    connectOrCreate?: UserCreateOrConnectWithoutEmailConfirmationsInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutEmailConfirmationsNestedInput = {
    create?: XOR<UserCreateWithoutEmailConfirmationsInput, UserUncheckedCreateWithoutEmailConfirmationsInput>
    connectOrCreate?: UserCreateOrConnectWithoutEmailConfirmationsInput
    upsert?: UserUpsertWithoutEmailConfirmationsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutEmailConfirmationsInput, UserUpdateWithoutEmailConfirmationsInput>, UserUncheckedUpdateWithoutEmailConfirmationsInput>
  }

  export type UserCreateNestedOneWithoutPasswordResetsInput = {
    create?: XOR<UserCreateWithoutPasswordResetsInput, UserUncheckedCreateWithoutPasswordResetsInput>
    connectOrCreate?: UserCreateOrConnectWithoutPasswordResetsInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutPasswordResetsNestedInput = {
    create?: XOR<UserCreateWithoutPasswordResetsInput, UserUncheckedCreateWithoutPasswordResetsInput>
    connectOrCreate?: UserCreateOrConnectWithoutPasswordResetsInput
    upsert?: UserUpsertWithoutPasswordResetsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutPasswordResetsInput, UserUpdateWithoutPasswordResetsInput>, UserUncheckedUpdateWithoutPasswordResetsInput>
  }

  export type UserCreateNestedOneWithoutRefreshTokensInput = {
    create?: XOR<UserCreateWithoutRefreshTokensInput, UserUncheckedCreateWithoutRefreshTokensInput>
    connectOrCreate?: UserCreateOrConnectWithoutRefreshTokensInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutRefreshTokensNestedInput = {
    create?: XOR<UserCreateWithoutRefreshTokensInput, UserUncheckedCreateWithoutRefreshTokensInput>
    connectOrCreate?: UserCreateOrConnectWithoutRefreshTokensInput
    upsert?: UserUpsertWithoutRefreshTokensInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutRefreshTokensInput, UserUpdateWithoutRefreshTokensInput>, UserUncheckedUpdateWithoutRefreshTokensInput>
  }

  export type life_eventsCreateNestedManyWithoutEventInput = {
    create?: XOR<life_eventsCreateWithoutEventInput, life_eventsUncheckedCreateWithoutEventInput> | life_eventsCreateWithoutEventInput[] | life_eventsUncheckedCreateWithoutEventInput[]
    connectOrCreate?: life_eventsCreateOrConnectWithoutEventInput | life_eventsCreateOrConnectWithoutEventInput[]
    createMany?: life_eventsCreateManyEventInputEnvelope
    connect?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
  }

  export type UserCreateNestedOneWithoutEventsInput = {
    create?: XOR<UserCreateWithoutEventsInput, UserUncheckedCreateWithoutEventsInput>
    connectOrCreate?: UserCreateOrConnectWithoutEventsInput
    connect?: UserWhereUniqueInput
  }

  export type life_eventsUncheckedCreateNestedManyWithoutEventInput = {
    create?: XOR<life_eventsCreateWithoutEventInput, life_eventsUncheckedCreateWithoutEventInput> | life_eventsCreateWithoutEventInput[] | life_eventsUncheckedCreateWithoutEventInput[]
    connectOrCreate?: life_eventsCreateOrConnectWithoutEventInput | life_eventsCreateOrConnectWithoutEventInput[]
    createMany?: life_eventsCreateManyEventInputEnvelope
    connect?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type life_eventsUpdateManyWithoutEventNestedInput = {
    create?: XOR<life_eventsCreateWithoutEventInput, life_eventsUncheckedCreateWithoutEventInput> | life_eventsCreateWithoutEventInput[] | life_eventsUncheckedCreateWithoutEventInput[]
    connectOrCreate?: life_eventsCreateOrConnectWithoutEventInput | life_eventsCreateOrConnectWithoutEventInput[]
    upsert?: life_eventsUpsertWithWhereUniqueWithoutEventInput | life_eventsUpsertWithWhereUniqueWithoutEventInput[]
    createMany?: life_eventsCreateManyEventInputEnvelope
    set?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
    disconnect?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
    delete?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
    connect?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
    update?: life_eventsUpdateWithWhereUniqueWithoutEventInput | life_eventsUpdateWithWhereUniqueWithoutEventInput[]
    updateMany?: life_eventsUpdateManyWithWhereWithoutEventInput | life_eventsUpdateManyWithWhereWithoutEventInput[]
    deleteMany?: life_eventsScalarWhereInput | life_eventsScalarWhereInput[]
  }

  export type UserUpdateOneRequiredWithoutEventsNestedInput = {
    create?: XOR<UserCreateWithoutEventsInput, UserUncheckedCreateWithoutEventsInput>
    connectOrCreate?: UserCreateOrConnectWithoutEventsInput
    upsert?: UserUpsertWithoutEventsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutEventsInput, UserUpdateWithoutEventsInput>, UserUncheckedUpdateWithoutEventsInput>
  }

  export type life_eventsUncheckedUpdateManyWithoutEventNestedInput = {
    create?: XOR<life_eventsCreateWithoutEventInput, life_eventsUncheckedCreateWithoutEventInput> | life_eventsCreateWithoutEventInput[] | life_eventsUncheckedCreateWithoutEventInput[]
    connectOrCreate?: life_eventsCreateOrConnectWithoutEventInput | life_eventsCreateOrConnectWithoutEventInput[]
    upsert?: life_eventsUpsertWithWhereUniqueWithoutEventInput | life_eventsUpsertWithWhereUniqueWithoutEventInput[]
    createMany?: life_eventsCreateManyEventInputEnvelope
    set?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
    disconnect?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
    delete?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
    connect?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
    update?: life_eventsUpdateWithWhereUniqueWithoutEventInput | life_eventsUpdateWithWhereUniqueWithoutEventInput[]
    updateMany?: life_eventsUpdateManyWithWhereWithoutEventInput | life_eventsUpdateManyWithWhereWithoutEventInput[]
    deleteMany?: life_eventsScalarWhereInput | life_eventsScalarWhereInput[]
  }

  export type life_eventsCreateNestedManyWithoutEvent_typeInput = {
    create?: XOR<life_eventsCreateWithoutEvent_typeInput, life_eventsUncheckedCreateWithoutEvent_typeInput> | life_eventsCreateWithoutEvent_typeInput[] | life_eventsUncheckedCreateWithoutEvent_typeInput[]
    connectOrCreate?: life_eventsCreateOrConnectWithoutEvent_typeInput | life_eventsCreateOrConnectWithoutEvent_typeInput[]
    createMany?: life_eventsCreateManyEvent_typeInputEnvelope
    connect?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
  }

  export type UserCreateNestedOneWithoutEvent_typesInput = {
    create?: XOR<UserCreateWithoutEvent_typesInput, UserUncheckedCreateWithoutEvent_typesInput>
    connectOrCreate?: UserCreateOrConnectWithoutEvent_typesInput
    connect?: UserWhereUniqueInput
  }

  export type life_eventsUncheckedCreateNestedManyWithoutEvent_typeInput = {
    create?: XOR<life_eventsCreateWithoutEvent_typeInput, life_eventsUncheckedCreateWithoutEvent_typeInput> | life_eventsCreateWithoutEvent_typeInput[] | life_eventsUncheckedCreateWithoutEvent_typeInput[]
    connectOrCreate?: life_eventsCreateOrConnectWithoutEvent_typeInput | life_eventsCreateOrConnectWithoutEvent_typeInput[]
    createMany?: life_eventsCreateManyEvent_typeInputEnvelope
    connect?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
  }

  export type life_eventsUpdateManyWithoutEvent_typeNestedInput = {
    create?: XOR<life_eventsCreateWithoutEvent_typeInput, life_eventsUncheckedCreateWithoutEvent_typeInput> | life_eventsCreateWithoutEvent_typeInput[] | life_eventsUncheckedCreateWithoutEvent_typeInput[]
    connectOrCreate?: life_eventsCreateOrConnectWithoutEvent_typeInput | life_eventsCreateOrConnectWithoutEvent_typeInput[]
    upsert?: life_eventsUpsertWithWhereUniqueWithoutEvent_typeInput | life_eventsUpsertWithWhereUniqueWithoutEvent_typeInput[]
    createMany?: life_eventsCreateManyEvent_typeInputEnvelope
    set?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
    disconnect?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
    delete?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
    connect?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
    update?: life_eventsUpdateWithWhereUniqueWithoutEvent_typeInput | life_eventsUpdateWithWhereUniqueWithoutEvent_typeInput[]
    updateMany?: life_eventsUpdateManyWithWhereWithoutEvent_typeInput | life_eventsUpdateManyWithWhereWithoutEvent_typeInput[]
    deleteMany?: life_eventsScalarWhereInput | life_eventsScalarWhereInput[]
  }

  export type UserUpdateOneRequiredWithoutEvent_typesNestedInput = {
    create?: XOR<UserCreateWithoutEvent_typesInput, UserUncheckedCreateWithoutEvent_typesInput>
    connectOrCreate?: UserCreateOrConnectWithoutEvent_typesInput
    upsert?: UserUpsertWithoutEvent_typesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutEvent_typesInput, UserUpdateWithoutEvent_typesInput>, UserUncheckedUpdateWithoutEvent_typesInput>
  }

  export type life_eventsUncheckedUpdateManyWithoutEvent_typeNestedInput = {
    create?: XOR<life_eventsCreateWithoutEvent_typeInput, life_eventsUncheckedCreateWithoutEvent_typeInput> | life_eventsCreateWithoutEvent_typeInput[] | life_eventsUncheckedCreateWithoutEvent_typeInput[]
    connectOrCreate?: life_eventsCreateOrConnectWithoutEvent_typeInput | life_eventsCreateOrConnectWithoutEvent_typeInput[]
    upsert?: life_eventsUpsertWithWhereUniqueWithoutEvent_typeInput | life_eventsUpsertWithWhereUniqueWithoutEvent_typeInput[]
    createMany?: life_eventsCreateManyEvent_typeInputEnvelope
    set?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
    disconnect?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
    delete?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
    connect?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
    update?: life_eventsUpdateWithWhereUniqueWithoutEvent_typeInput | life_eventsUpdateWithWhereUniqueWithoutEvent_typeInput[]
    updateMany?: life_eventsUpdateManyWithWhereWithoutEvent_typeInput | life_eventsUpdateManyWithWhereWithoutEvent_typeInput[]
    deleteMany?: life_eventsScalarWhereInput | life_eventsScalarWhereInput[]
  }

  export type eventsCreateNestedOneWithoutLife_eventsInput = {
    create?: XOR<eventsCreateWithoutLife_eventsInput, eventsUncheckedCreateWithoutLife_eventsInput>
    connectOrCreate?: eventsCreateOrConnectWithoutLife_eventsInput
    connect?: eventsWhereUniqueInput
  }

  export type event_typesCreateNestedOneWithoutLife_eventsInput = {
    create?: XOR<event_typesCreateWithoutLife_eventsInput, event_typesUncheckedCreateWithoutLife_eventsInput>
    connectOrCreate?: event_typesCreateOrConnectWithoutLife_eventsInput
    connect?: event_typesWhereUniqueInput
  }

  export type personsCreateNestedOneWithoutLife_eventsInput = {
    create?: XOR<personsCreateWithoutLife_eventsInput, personsUncheckedCreateWithoutLife_eventsInput>
    connectOrCreate?: personsCreateOrConnectWithoutLife_eventsInput
    connect?: personsWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutLife_eventsInput = {
    create?: XOR<UserCreateWithoutLife_eventsInput, UserUncheckedCreateWithoutLife_eventsInput>
    connectOrCreate?: UserCreateOrConnectWithoutLife_eventsInput
    connect?: UserWhereUniqueInput
  }

  export type eventsUpdateOneWithoutLife_eventsNestedInput = {
    create?: XOR<eventsCreateWithoutLife_eventsInput, eventsUncheckedCreateWithoutLife_eventsInput>
    connectOrCreate?: eventsCreateOrConnectWithoutLife_eventsInput
    upsert?: eventsUpsertWithoutLife_eventsInput
    disconnect?: eventsWhereInput | boolean
    delete?: eventsWhereInput | boolean
    connect?: eventsWhereUniqueInput
    update?: XOR<XOR<eventsUpdateToOneWithWhereWithoutLife_eventsInput, eventsUpdateWithoutLife_eventsInput>, eventsUncheckedUpdateWithoutLife_eventsInput>
  }

  export type event_typesUpdateOneWithoutLife_eventsNestedInput = {
    create?: XOR<event_typesCreateWithoutLife_eventsInput, event_typesUncheckedCreateWithoutLife_eventsInput>
    connectOrCreate?: event_typesCreateOrConnectWithoutLife_eventsInput
    upsert?: event_typesUpsertWithoutLife_eventsInput
    disconnect?: event_typesWhereInput | boolean
    delete?: event_typesWhereInput | boolean
    connect?: event_typesWhereUniqueInput
    update?: XOR<XOR<event_typesUpdateToOneWithWhereWithoutLife_eventsInput, event_typesUpdateWithoutLife_eventsInput>, event_typesUncheckedUpdateWithoutLife_eventsInput>
  }

  export type personsUpdateOneWithoutLife_eventsNestedInput = {
    create?: XOR<personsCreateWithoutLife_eventsInput, personsUncheckedCreateWithoutLife_eventsInput>
    connectOrCreate?: personsCreateOrConnectWithoutLife_eventsInput
    upsert?: personsUpsertWithoutLife_eventsInput
    disconnect?: personsWhereInput | boolean
    delete?: personsWhereInput | boolean
    connect?: personsWhereUniqueInput
    update?: XOR<XOR<personsUpdateToOneWithWhereWithoutLife_eventsInput, personsUpdateWithoutLife_eventsInput>, personsUncheckedUpdateWithoutLife_eventsInput>
  }

  export type UserUpdateOneRequiredWithoutLife_eventsNestedInput = {
    create?: XOR<UserCreateWithoutLife_eventsInput, UserUncheckedCreateWithoutLife_eventsInput>
    connectOrCreate?: UserCreateOrConnectWithoutLife_eventsInput
    upsert?: UserUpsertWithoutLife_eventsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutLife_eventsInput, UserUpdateWithoutLife_eventsInput>, UserUncheckedUpdateWithoutLife_eventsInput>
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type life_eventsCreateNestedManyWithoutPersonsInput = {
    create?: XOR<life_eventsCreateWithoutPersonsInput, life_eventsUncheckedCreateWithoutPersonsInput> | life_eventsCreateWithoutPersonsInput[] | life_eventsUncheckedCreateWithoutPersonsInput[]
    connectOrCreate?: life_eventsCreateOrConnectWithoutPersonsInput | life_eventsCreateOrConnectWithoutPersonsInput[]
    createMany?: life_eventsCreateManyPersonsInputEnvelope
    connect?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
  }

  export type UserCreateNestedOneWithoutPersonsInput = {
    create?: XOR<UserCreateWithoutPersonsInput, UserUncheckedCreateWithoutPersonsInput>
    connectOrCreate?: UserCreateOrConnectWithoutPersonsInput
    connect?: UserWhereUniqueInput
  }

  export type person_relationsCreateNestedManyWithoutFrom_personInput = {
    create?: XOR<person_relationsCreateWithoutFrom_personInput, person_relationsUncheckedCreateWithoutFrom_personInput> | person_relationsCreateWithoutFrom_personInput[] | person_relationsUncheckedCreateWithoutFrom_personInput[]
    connectOrCreate?: person_relationsCreateOrConnectWithoutFrom_personInput | person_relationsCreateOrConnectWithoutFrom_personInput[]
    createMany?: person_relationsCreateManyFrom_personInputEnvelope
    connect?: person_relationsWhereUniqueInput | person_relationsWhereUniqueInput[]
  }

  export type person_relationsCreateNestedManyWithoutTo_personInput = {
    create?: XOR<person_relationsCreateWithoutTo_personInput, person_relationsUncheckedCreateWithoutTo_personInput> | person_relationsCreateWithoutTo_personInput[] | person_relationsUncheckedCreateWithoutTo_personInput[]
    connectOrCreate?: person_relationsCreateOrConnectWithoutTo_personInput | person_relationsCreateOrConnectWithoutTo_personInput[]
    createMany?: person_relationsCreateManyTo_personInputEnvelope
    connect?: person_relationsWhereUniqueInput | person_relationsWhereUniqueInput[]
  }

  export type life_eventsUncheckedCreateNestedManyWithoutPersonsInput = {
    create?: XOR<life_eventsCreateWithoutPersonsInput, life_eventsUncheckedCreateWithoutPersonsInput> | life_eventsCreateWithoutPersonsInput[] | life_eventsUncheckedCreateWithoutPersonsInput[]
    connectOrCreate?: life_eventsCreateOrConnectWithoutPersonsInput | life_eventsCreateOrConnectWithoutPersonsInput[]
    createMany?: life_eventsCreateManyPersonsInputEnvelope
    connect?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
  }

  export type person_relationsUncheckedCreateNestedManyWithoutFrom_personInput = {
    create?: XOR<person_relationsCreateWithoutFrom_personInput, person_relationsUncheckedCreateWithoutFrom_personInput> | person_relationsCreateWithoutFrom_personInput[] | person_relationsUncheckedCreateWithoutFrom_personInput[]
    connectOrCreate?: person_relationsCreateOrConnectWithoutFrom_personInput | person_relationsCreateOrConnectWithoutFrom_personInput[]
    createMany?: person_relationsCreateManyFrom_personInputEnvelope
    connect?: person_relationsWhereUniqueInput | person_relationsWhereUniqueInput[]
  }

  export type person_relationsUncheckedCreateNestedManyWithoutTo_personInput = {
    create?: XOR<person_relationsCreateWithoutTo_personInput, person_relationsUncheckedCreateWithoutTo_personInput> | person_relationsCreateWithoutTo_personInput[] | person_relationsUncheckedCreateWithoutTo_personInput[]
    connectOrCreate?: person_relationsCreateOrConnectWithoutTo_personInput | person_relationsCreateOrConnectWithoutTo_personInput[]
    createMany?: person_relationsCreateManyTo_personInputEnvelope
    connect?: person_relationsWhereUniqueInput | person_relationsWhereUniqueInput[]
  }

  export type life_eventsUpdateManyWithoutPersonsNestedInput = {
    create?: XOR<life_eventsCreateWithoutPersonsInput, life_eventsUncheckedCreateWithoutPersonsInput> | life_eventsCreateWithoutPersonsInput[] | life_eventsUncheckedCreateWithoutPersonsInput[]
    connectOrCreate?: life_eventsCreateOrConnectWithoutPersonsInput | life_eventsCreateOrConnectWithoutPersonsInput[]
    upsert?: life_eventsUpsertWithWhereUniqueWithoutPersonsInput | life_eventsUpsertWithWhereUniqueWithoutPersonsInput[]
    createMany?: life_eventsCreateManyPersonsInputEnvelope
    set?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
    disconnect?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
    delete?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
    connect?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
    update?: life_eventsUpdateWithWhereUniqueWithoutPersonsInput | life_eventsUpdateWithWhereUniqueWithoutPersonsInput[]
    updateMany?: life_eventsUpdateManyWithWhereWithoutPersonsInput | life_eventsUpdateManyWithWhereWithoutPersonsInput[]
    deleteMany?: life_eventsScalarWhereInput | life_eventsScalarWhereInput[]
  }

  export type UserUpdateOneRequiredWithoutPersonsNestedInput = {
    create?: XOR<UserCreateWithoutPersonsInput, UserUncheckedCreateWithoutPersonsInput>
    connectOrCreate?: UserCreateOrConnectWithoutPersonsInput
    upsert?: UserUpsertWithoutPersonsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutPersonsInput, UserUpdateWithoutPersonsInput>, UserUncheckedUpdateWithoutPersonsInput>
  }

  export type person_relationsUpdateManyWithoutFrom_personNestedInput = {
    create?: XOR<person_relationsCreateWithoutFrom_personInput, person_relationsUncheckedCreateWithoutFrom_personInput> | person_relationsCreateWithoutFrom_personInput[] | person_relationsUncheckedCreateWithoutFrom_personInput[]
    connectOrCreate?: person_relationsCreateOrConnectWithoutFrom_personInput | person_relationsCreateOrConnectWithoutFrom_personInput[]
    upsert?: person_relationsUpsertWithWhereUniqueWithoutFrom_personInput | person_relationsUpsertWithWhereUniqueWithoutFrom_personInput[]
    createMany?: person_relationsCreateManyFrom_personInputEnvelope
    set?: person_relationsWhereUniqueInput | person_relationsWhereUniqueInput[]
    disconnect?: person_relationsWhereUniqueInput | person_relationsWhereUniqueInput[]
    delete?: person_relationsWhereUniqueInput | person_relationsWhereUniqueInput[]
    connect?: person_relationsWhereUniqueInput | person_relationsWhereUniqueInput[]
    update?: person_relationsUpdateWithWhereUniqueWithoutFrom_personInput | person_relationsUpdateWithWhereUniqueWithoutFrom_personInput[]
    updateMany?: person_relationsUpdateManyWithWhereWithoutFrom_personInput | person_relationsUpdateManyWithWhereWithoutFrom_personInput[]
    deleteMany?: person_relationsScalarWhereInput | person_relationsScalarWhereInput[]
  }

  export type person_relationsUpdateManyWithoutTo_personNestedInput = {
    create?: XOR<person_relationsCreateWithoutTo_personInput, person_relationsUncheckedCreateWithoutTo_personInput> | person_relationsCreateWithoutTo_personInput[] | person_relationsUncheckedCreateWithoutTo_personInput[]
    connectOrCreate?: person_relationsCreateOrConnectWithoutTo_personInput | person_relationsCreateOrConnectWithoutTo_personInput[]
    upsert?: person_relationsUpsertWithWhereUniqueWithoutTo_personInput | person_relationsUpsertWithWhereUniqueWithoutTo_personInput[]
    createMany?: person_relationsCreateManyTo_personInputEnvelope
    set?: person_relationsWhereUniqueInput | person_relationsWhereUniqueInput[]
    disconnect?: person_relationsWhereUniqueInput | person_relationsWhereUniqueInput[]
    delete?: person_relationsWhereUniqueInput | person_relationsWhereUniqueInput[]
    connect?: person_relationsWhereUniqueInput | person_relationsWhereUniqueInput[]
    update?: person_relationsUpdateWithWhereUniqueWithoutTo_personInput | person_relationsUpdateWithWhereUniqueWithoutTo_personInput[]
    updateMany?: person_relationsUpdateManyWithWhereWithoutTo_personInput | person_relationsUpdateManyWithWhereWithoutTo_personInput[]
    deleteMany?: person_relationsScalarWhereInput | person_relationsScalarWhereInput[]
  }

  export type life_eventsUncheckedUpdateManyWithoutPersonsNestedInput = {
    create?: XOR<life_eventsCreateWithoutPersonsInput, life_eventsUncheckedCreateWithoutPersonsInput> | life_eventsCreateWithoutPersonsInput[] | life_eventsUncheckedCreateWithoutPersonsInput[]
    connectOrCreate?: life_eventsCreateOrConnectWithoutPersonsInput | life_eventsCreateOrConnectWithoutPersonsInput[]
    upsert?: life_eventsUpsertWithWhereUniqueWithoutPersonsInput | life_eventsUpsertWithWhereUniqueWithoutPersonsInput[]
    createMany?: life_eventsCreateManyPersonsInputEnvelope
    set?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
    disconnect?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
    delete?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
    connect?: life_eventsWhereUniqueInput | life_eventsWhereUniqueInput[]
    update?: life_eventsUpdateWithWhereUniqueWithoutPersonsInput | life_eventsUpdateWithWhereUniqueWithoutPersonsInput[]
    updateMany?: life_eventsUpdateManyWithWhereWithoutPersonsInput | life_eventsUpdateManyWithWhereWithoutPersonsInput[]
    deleteMany?: life_eventsScalarWhereInput | life_eventsScalarWhereInput[]
  }

  export type person_relationsUncheckedUpdateManyWithoutFrom_personNestedInput = {
    create?: XOR<person_relationsCreateWithoutFrom_personInput, person_relationsUncheckedCreateWithoutFrom_personInput> | person_relationsCreateWithoutFrom_personInput[] | person_relationsUncheckedCreateWithoutFrom_personInput[]
    connectOrCreate?: person_relationsCreateOrConnectWithoutFrom_personInput | person_relationsCreateOrConnectWithoutFrom_personInput[]
    upsert?: person_relationsUpsertWithWhereUniqueWithoutFrom_personInput | person_relationsUpsertWithWhereUniqueWithoutFrom_personInput[]
    createMany?: person_relationsCreateManyFrom_personInputEnvelope
    set?: person_relationsWhereUniqueInput | person_relationsWhereUniqueInput[]
    disconnect?: person_relationsWhereUniqueInput | person_relationsWhereUniqueInput[]
    delete?: person_relationsWhereUniqueInput | person_relationsWhereUniqueInput[]
    connect?: person_relationsWhereUniqueInput | person_relationsWhereUniqueInput[]
    update?: person_relationsUpdateWithWhereUniqueWithoutFrom_personInput | person_relationsUpdateWithWhereUniqueWithoutFrom_personInput[]
    updateMany?: person_relationsUpdateManyWithWhereWithoutFrom_personInput | person_relationsUpdateManyWithWhereWithoutFrom_personInput[]
    deleteMany?: person_relationsScalarWhereInput | person_relationsScalarWhereInput[]
  }

  export type person_relationsUncheckedUpdateManyWithoutTo_personNestedInput = {
    create?: XOR<person_relationsCreateWithoutTo_personInput, person_relationsUncheckedCreateWithoutTo_personInput> | person_relationsCreateWithoutTo_personInput[] | person_relationsUncheckedCreateWithoutTo_personInput[]
    connectOrCreate?: person_relationsCreateOrConnectWithoutTo_personInput | person_relationsCreateOrConnectWithoutTo_personInput[]
    upsert?: person_relationsUpsertWithWhereUniqueWithoutTo_personInput | person_relationsUpsertWithWhereUniqueWithoutTo_personInput[]
    createMany?: person_relationsCreateManyTo_personInputEnvelope
    set?: person_relationsWhereUniqueInput | person_relationsWhereUniqueInput[]
    disconnect?: person_relationsWhereUniqueInput | person_relationsWhereUniqueInput[]
    delete?: person_relationsWhereUniqueInput | person_relationsWhereUniqueInput[]
    connect?: person_relationsWhereUniqueInput | person_relationsWhereUniqueInput[]
    update?: person_relationsUpdateWithWhereUniqueWithoutTo_personInput | person_relationsUpdateWithWhereUniqueWithoutTo_personInput[]
    updateMany?: person_relationsUpdateManyWithWhereWithoutTo_personInput | person_relationsUpdateManyWithWhereWithoutTo_personInput[]
    deleteMany?: person_relationsScalarWhereInput | person_relationsScalarWhereInput[]
  }

  export type personsCreateNestedOneWithoutRelations_fromInput = {
    create?: XOR<personsCreateWithoutRelations_fromInput, personsUncheckedCreateWithoutRelations_fromInput>
    connectOrCreate?: personsCreateOrConnectWithoutRelations_fromInput
    connect?: personsWhereUniqueInput
  }

  export type personsCreateNestedOneWithoutRelations_toInput = {
    create?: XOR<personsCreateWithoutRelations_toInput, personsUncheckedCreateWithoutRelations_toInput>
    connectOrCreate?: personsCreateOrConnectWithoutRelations_toInput
    connect?: personsWhereUniqueInput
  }

  export type personsUpdateOneRequiredWithoutRelations_fromNestedInput = {
    create?: XOR<personsCreateWithoutRelations_fromInput, personsUncheckedCreateWithoutRelations_fromInput>
    connectOrCreate?: personsCreateOrConnectWithoutRelations_fromInput
    upsert?: personsUpsertWithoutRelations_fromInput
    connect?: personsWhereUniqueInput
    update?: XOR<XOR<personsUpdateToOneWithWhereWithoutRelations_fromInput, personsUpdateWithoutRelations_fromInput>, personsUncheckedUpdateWithoutRelations_fromInput>
  }

  export type personsUpdateOneRequiredWithoutRelations_toNestedInput = {
    create?: XOR<personsCreateWithoutRelations_toInput, personsUncheckedCreateWithoutRelations_toInput>
    connectOrCreate?: personsCreateOrConnectWithoutRelations_toInput
    upsert?: personsUpsertWithoutRelations_toInput
    connect?: personsWhereUniqueInput
    update?: XOR<XOR<personsUpdateToOneWithWhereWithoutRelations_toInput, personsUpdateWithoutRelations_toInput>, personsUncheckedUpdateWithoutRelations_toInput>
  }

  export type UserCreateNestedOneWithoutLiteratureInput = {
    create?: XOR<UserCreateWithoutLiteratureInput, UserUncheckedCreateWithoutLiteratureInput>
    connectOrCreate?: UserCreateOrConnectWithoutLiteratureInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutLiteratureNestedInput = {
    create?: XOR<UserCreateWithoutLiteratureInput, UserUncheckedCreateWithoutLiteratureInput>
    connectOrCreate?: UserCreateOrConnectWithoutLiteratureInput
    upsert?: UserUpsertWithoutLiteratureInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutLiteratureInput, UserUpdateWithoutLiteratureInput>, UserUncheckedUpdateWithoutLiteratureInput>
  }

  export type UserCreateNestedOneWithoutBibliographySyncsInput = {
    create?: XOR<UserCreateWithoutBibliographySyncsInput, UserUncheckedCreateWithoutBibliographySyncsInput>
    connectOrCreate?: UserCreateOrConnectWithoutBibliographySyncsInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutBibliographySyncsNestedInput = {
    create?: XOR<UserCreateWithoutBibliographySyncsInput, UserUncheckedCreateWithoutBibliographySyncsInput>
    connectOrCreate?: UserCreateOrConnectWithoutBibliographySyncsInput
    upsert?: UserUpsertWithoutBibliographySyncsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutBibliographySyncsInput, UserUpdateWithoutBibliographySyncsInput>, UserUncheckedUpdateWithoutBibliographySyncsInput>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedEnumUserRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[]
    notIn?: $Enums.UserRole[]
    not?: NestedEnumUserRoleFilter<$PrismaModel> | $Enums.UserRole
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedEnumUserRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[]
    notIn?: $Enums.UserRole[]
    not?: NestedEnumUserRoleWithAggregatesFilter<$PrismaModel> | $Enums.UserRole
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumUserRoleFilter<$PrismaModel>
    _max?: NestedEnumUserRoleFilter<$PrismaModel>
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue
    lte?: InputJsonValue
    gt?: InputJsonValue
    gte?: InputJsonValue
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type EmailConfirmationCreateWithoutUserInput = {
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type EmailConfirmationUncheckedCreateWithoutUserInput = {
    id?: number
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type EmailConfirmationCreateOrConnectWithoutUserInput = {
    where: EmailConfirmationWhereUniqueInput
    create: XOR<EmailConfirmationCreateWithoutUserInput, EmailConfirmationUncheckedCreateWithoutUserInput>
  }

  export type EmailConfirmationCreateManyUserInputEnvelope = {
    data: EmailConfirmationCreateManyUserInput | EmailConfirmationCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type PasswordResetCreateWithoutUserInput = {
    token: string
    expiresAt: Date | string
    used?: boolean
    createdAt?: Date | string
  }

  export type PasswordResetUncheckedCreateWithoutUserInput = {
    id?: number
    token: string
    expiresAt: Date | string
    used?: boolean
    createdAt?: Date | string
  }

  export type PasswordResetCreateOrConnectWithoutUserInput = {
    where: PasswordResetWhereUniqueInput
    create: XOR<PasswordResetCreateWithoutUserInput, PasswordResetUncheckedCreateWithoutUserInput>
  }

  export type PasswordResetCreateManyUserInputEnvelope = {
    data: PasswordResetCreateManyUserInput | PasswordResetCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type RefreshTokenCreateWithoutUserInput = {
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type RefreshTokenUncheckedCreateWithoutUserInput = {
    id?: number
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type RefreshTokenCreateOrConnectWithoutUserInput = {
    where: RefreshTokenWhereUniqueInput
    create: XOR<RefreshTokenCreateWithoutUserInput, RefreshTokenUncheckedCreateWithoutUserInput>
  }

  export type RefreshTokenCreateManyUserInputEnvelope = {
    data: RefreshTokenCreateManyUserInput | RefreshTokenCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type eventsCreateWithoutUserInput = {
    title: string
    description?: string | null
    date?: Date | string | null
    end_date?: Date | string | null
    location?: string | null
    life_events?: life_eventsCreateNestedManyWithoutEventInput
  }

  export type eventsUncheckedCreateWithoutUserInput = {
    id?: number
    title: string
    description?: string | null
    date?: Date | string | null
    end_date?: Date | string | null
    location?: string | null
    life_events?: life_eventsUncheckedCreateNestedManyWithoutEventInput
  }

  export type eventsCreateOrConnectWithoutUserInput = {
    where: eventsWhereUniqueInput
    create: XOR<eventsCreateWithoutUserInput, eventsUncheckedCreateWithoutUserInput>
  }

  export type eventsCreateManyUserInputEnvelope = {
    data: eventsCreateManyUserInput | eventsCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type personsCreateWithoutUserInput = {
    first_name?: string | null
    last_name?: string | null
    birth_date?: Date | string | null
    birth_place?: string | null
    death_date?: Date | string | null
    death_place?: string | null
    notes?: string | null
    life_events?: life_eventsCreateNestedManyWithoutPersonsInput
    relations_from?: person_relationsCreateNestedManyWithoutFrom_personInput
    relations_to?: person_relationsCreateNestedManyWithoutTo_personInput
  }

  export type personsUncheckedCreateWithoutUserInput = {
    id?: number
    first_name?: string | null
    last_name?: string | null
    birth_date?: Date | string | null
    birth_place?: string | null
    death_date?: Date | string | null
    death_place?: string | null
    notes?: string | null
    life_events?: life_eventsUncheckedCreateNestedManyWithoutPersonsInput
    relations_from?: person_relationsUncheckedCreateNestedManyWithoutFrom_personInput
    relations_to?: person_relationsUncheckedCreateNestedManyWithoutTo_personInput
  }

  export type personsCreateOrConnectWithoutUserInput = {
    where: personsWhereUniqueInput
    create: XOR<personsCreateWithoutUserInput, personsUncheckedCreateWithoutUserInput>
  }

  export type personsCreateManyUserInputEnvelope = {
    data: personsCreateManyUserInput | personsCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type life_eventsCreateWithoutUserInput = {
    title?: string | null
    start_date?: Date | string | null
    end_date?: Date | string | null
    location?: string | null
    description?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    event?: eventsCreateNestedOneWithoutLife_eventsInput
    event_type?: event_typesCreateNestedOneWithoutLife_eventsInput
    persons?: personsCreateNestedOneWithoutLife_eventsInput
  }

  export type life_eventsUncheckedCreateWithoutUserInput = {
    id?: number
    person_id?: number | null
    event_id?: number | null
    title?: string | null
    start_date?: Date | string | null
    end_date?: Date | string | null
    location?: string | null
    description?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    event_type_id?: number | null
  }

  export type life_eventsCreateOrConnectWithoutUserInput = {
    where: life_eventsWhereUniqueInput
    create: XOR<life_eventsCreateWithoutUserInput, life_eventsUncheckedCreateWithoutUserInput>
  }

  export type life_eventsCreateManyUserInputEnvelope = {
    data: life_eventsCreateManyUserInput | life_eventsCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type event_typesCreateWithoutUserInput = {
    name?: string | null
    icon?: string | null
    color?: string | null
    life_events?: life_eventsCreateNestedManyWithoutEvent_typeInput
  }

  export type event_typesUncheckedCreateWithoutUserInput = {
    id?: number
    name?: string | null
    icon?: string | null
    color?: string | null
    life_events?: life_eventsUncheckedCreateNestedManyWithoutEvent_typeInput
  }

  export type event_typesCreateOrConnectWithoutUserInput = {
    where: event_typesWhereUniqueInput
    create: XOR<event_typesCreateWithoutUserInput, event_typesUncheckedCreateWithoutUserInput>
  }

  export type event_typesCreateManyUserInputEnvelope = {
    data: event_typesCreateManyUserInput | event_typesCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type literatureCreateWithoutUserInput = {
    title: string
    author: string
    publicationYear?: number | null
    type: string
    description?: string | null
    url?: string | null
    publisher?: string | null
    journal?: string | null
    volume?: string | null
    issue?: string | null
    pages?: string | null
    doi?: string | null
    isbn?: string | null
    issn?: string | null
    language?: string | null
    keywords?: string | null
    abstract?: string | null
    externalId?: string | null
    syncSource?: string | null
    lastSyncedAt?: Date | string | null
    syncMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type literatureUncheckedCreateWithoutUserInput = {
    id?: number
    title: string
    author: string
    publicationYear?: number | null
    type: string
    description?: string | null
    url?: string | null
    publisher?: string | null
    journal?: string | null
    volume?: string | null
    issue?: string | null
    pages?: string | null
    doi?: string | null
    isbn?: string | null
    issn?: string | null
    language?: string | null
    keywords?: string | null
    abstract?: string | null
    externalId?: string | null
    syncSource?: string | null
    lastSyncedAt?: Date | string | null
    syncMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type literatureCreateOrConnectWithoutUserInput = {
    where: literatureWhereUniqueInput
    create: XOR<literatureCreateWithoutUserInput, literatureUncheckedCreateWithoutUserInput>
  }

  export type literatureCreateManyUserInputEnvelope = {
    data: literatureCreateManyUserInput | literatureCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type BibliographySyncCreateWithoutUserInput = {
    service: string
    name: string
    isActive?: boolean
    apiKey?: string | null
    apiSecret?: string | null
    accessToken?: string | null
    refreshToken?: string | null
    tokenExpiresAt?: Date | string | null
    collectionId?: string | null
    collectionName?: string | null
    autoSync?: boolean
    syncInterval?: number | null
    lastSyncAt?: Date | string | null
    syncMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BibliographySyncUncheckedCreateWithoutUserInput = {
    id?: number
    service: string
    name: string
    isActive?: boolean
    apiKey?: string | null
    apiSecret?: string | null
    accessToken?: string | null
    refreshToken?: string | null
    tokenExpiresAt?: Date | string | null
    collectionId?: string | null
    collectionName?: string | null
    autoSync?: boolean
    syncInterval?: number | null
    lastSyncAt?: Date | string | null
    syncMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BibliographySyncCreateOrConnectWithoutUserInput = {
    where: BibliographySyncWhereUniqueInput
    create: XOR<BibliographySyncCreateWithoutUserInput, BibliographySyncUncheckedCreateWithoutUserInput>
  }

  export type BibliographySyncCreateManyUserInputEnvelope = {
    data: BibliographySyncCreateManyUserInput | BibliographySyncCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type EmailConfirmationUpsertWithWhereUniqueWithoutUserInput = {
    where: EmailConfirmationWhereUniqueInput
    update: XOR<EmailConfirmationUpdateWithoutUserInput, EmailConfirmationUncheckedUpdateWithoutUserInput>
    create: XOR<EmailConfirmationCreateWithoutUserInput, EmailConfirmationUncheckedCreateWithoutUserInput>
  }

  export type EmailConfirmationUpdateWithWhereUniqueWithoutUserInput = {
    where: EmailConfirmationWhereUniqueInput
    data: XOR<EmailConfirmationUpdateWithoutUserInput, EmailConfirmationUncheckedUpdateWithoutUserInput>
  }

  export type EmailConfirmationUpdateManyWithWhereWithoutUserInput = {
    where: EmailConfirmationScalarWhereInput
    data: XOR<EmailConfirmationUpdateManyMutationInput, EmailConfirmationUncheckedUpdateManyWithoutUserInput>
  }

  export type EmailConfirmationScalarWhereInput = {
    AND?: EmailConfirmationScalarWhereInput | EmailConfirmationScalarWhereInput[]
    OR?: EmailConfirmationScalarWhereInput[]
    NOT?: EmailConfirmationScalarWhereInput | EmailConfirmationScalarWhereInput[]
    id?: IntFilter<"EmailConfirmation"> | number
    userId?: IntFilter<"EmailConfirmation"> | number
    token?: StringFilter<"EmailConfirmation"> | string
    expiresAt?: DateTimeFilter<"EmailConfirmation"> | Date | string
    createdAt?: DateTimeFilter<"EmailConfirmation"> | Date | string
  }

  export type PasswordResetUpsertWithWhereUniqueWithoutUserInput = {
    where: PasswordResetWhereUniqueInput
    update: XOR<PasswordResetUpdateWithoutUserInput, PasswordResetUncheckedUpdateWithoutUserInput>
    create: XOR<PasswordResetCreateWithoutUserInput, PasswordResetUncheckedCreateWithoutUserInput>
  }

  export type PasswordResetUpdateWithWhereUniqueWithoutUserInput = {
    where: PasswordResetWhereUniqueInput
    data: XOR<PasswordResetUpdateWithoutUserInput, PasswordResetUncheckedUpdateWithoutUserInput>
  }

  export type PasswordResetUpdateManyWithWhereWithoutUserInput = {
    where: PasswordResetScalarWhereInput
    data: XOR<PasswordResetUpdateManyMutationInput, PasswordResetUncheckedUpdateManyWithoutUserInput>
  }

  export type PasswordResetScalarWhereInput = {
    AND?: PasswordResetScalarWhereInput | PasswordResetScalarWhereInput[]
    OR?: PasswordResetScalarWhereInput[]
    NOT?: PasswordResetScalarWhereInput | PasswordResetScalarWhereInput[]
    id?: IntFilter<"PasswordReset"> | number
    userId?: IntFilter<"PasswordReset"> | number
    token?: StringFilter<"PasswordReset"> | string
    expiresAt?: DateTimeFilter<"PasswordReset"> | Date | string
    used?: BoolFilter<"PasswordReset"> | boolean
    createdAt?: DateTimeFilter<"PasswordReset"> | Date | string
  }

  export type RefreshTokenUpsertWithWhereUniqueWithoutUserInput = {
    where: RefreshTokenWhereUniqueInput
    update: XOR<RefreshTokenUpdateWithoutUserInput, RefreshTokenUncheckedUpdateWithoutUserInput>
    create: XOR<RefreshTokenCreateWithoutUserInput, RefreshTokenUncheckedCreateWithoutUserInput>
  }

  export type RefreshTokenUpdateWithWhereUniqueWithoutUserInput = {
    where: RefreshTokenWhereUniqueInput
    data: XOR<RefreshTokenUpdateWithoutUserInput, RefreshTokenUncheckedUpdateWithoutUserInput>
  }

  export type RefreshTokenUpdateManyWithWhereWithoutUserInput = {
    where: RefreshTokenScalarWhereInput
    data: XOR<RefreshTokenUpdateManyMutationInput, RefreshTokenUncheckedUpdateManyWithoutUserInput>
  }

  export type RefreshTokenScalarWhereInput = {
    AND?: RefreshTokenScalarWhereInput | RefreshTokenScalarWhereInput[]
    OR?: RefreshTokenScalarWhereInput[]
    NOT?: RefreshTokenScalarWhereInput | RefreshTokenScalarWhereInput[]
    id?: IntFilter<"RefreshToken"> | number
    userId?: IntFilter<"RefreshToken"> | number
    token?: StringFilter<"RefreshToken"> | string
    expiresAt?: DateTimeFilter<"RefreshToken"> | Date | string
    createdAt?: DateTimeFilter<"RefreshToken"> | Date | string
  }

  export type eventsUpsertWithWhereUniqueWithoutUserInput = {
    where: eventsWhereUniqueInput
    update: XOR<eventsUpdateWithoutUserInput, eventsUncheckedUpdateWithoutUserInput>
    create: XOR<eventsCreateWithoutUserInput, eventsUncheckedCreateWithoutUserInput>
  }

  export type eventsUpdateWithWhereUniqueWithoutUserInput = {
    where: eventsWhereUniqueInput
    data: XOR<eventsUpdateWithoutUserInput, eventsUncheckedUpdateWithoutUserInput>
  }

  export type eventsUpdateManyWithWhereWithoutUserInput = {
    where: eventsScalarWhereInput
    data: XOR<eventsUpdateManyMutationInput, eventsUncheckedUpdateManyWithoutUserInput>
  }

  export type eventsScalarWhereInput = {
    AND?: eventsScalarWhereInput | eventsScalarWhereInput[]
    OR?: eventsScalarWhereInput[]
    NOT?: eventsScalarWhereInput | eventsScalarWhereInput[]
    id?: IntFilter<"events"> | number
    userId?: IntFilter<"events"> | number
    title?: StringFilter<"events"> | string
    description?: StringNullableFilter<"events"> | string | null
    date?: DateTimeNullableFilter<"events"> | Date | string | null
    end_date?: DateTimeNullableFilter<"events"> | Date | string | null
    location?: StringNullableFilter<"events"> | string | null
  }

  export type personsUpsertWithWhereUniqueWithoutUserInput = {
    where: personsWhereUniqueInput
    update: XOR<personsUpdateWithoutUserInput, personsUncheckedUpdateWithoutUserInput>
    create: XOR<personsCreateWithoutUserInput, personsUncheckedCreateWithoutUserInput>
  }

  export type personsUpdateWithWhereUniqueWithoutUserInput = {
    where: personsWhereUniqueInput
    data: XOR<personsUpdateWithoutUserInput, personsUncheckedUpdateWithoutUserInput>
  }

  export type personsUpdateManyWithWhereWithoutUserInput = {
    where: personsScalarWhereInput
    data: XOR<personsUpdateManyMutationInput, personsUncheckedUpdateManyWithoutUserInput>
  }

  export type personsScalarWhereInput = {
    AND?: personsScalarWhereInput | personsScalarWhereInput[]
    OR?: personsScalarWhereInput[]
    NOT?: personsScalarWhereInput | personsScalarWhereInput[]
    id?: IntFilter<"persons"> | number
    userId?: IntFilter<"persons"> | number
    first_name?: StringNullableFilter<"persons"> | string | null
    last_name?: StringNullableFilter<"persons"> | string | null
    birth_date?: DateTimeNullableFilter<"persons"> | Date | string | null
    birth_place?: StringNullableFilter<"persons"> | string | null
    death_date?: DateTimeNullableFilter<"persons"> | Date | string | null
    death_place?: StringNullableFilter<"persons"> | string | null
    notes?: StringNullableFilter<"persons"> | string | null
  }

  export type life_eventsUpsertWithWhereUniqueWithoutUserInput = {
    where: life_eventsWhereUniqueInput
    update: XOR<life_eventsUpdateWithoutUserInput, life_eventsUncheckedUpdateWithoutUserInput>
    create: XOR<life_eventsCreateWithoutUserInput, life_eventsUncheckedCreateWithoutUserInput>
  }

  export type life_eventsUpdateWithWhereUniqueWithoutUserInput = {
    where: life_eventsWhereUniqueInput
    data: XOR<life_eventsUpdateWithoutUserInput, life_eventsUncheckedUpdateWithoutUserInput>
  }

  export type life_eventsUpdateManyWithWhereWithoutUserInput = {
    where: life_eventsScalarWhereInput
    data: XOR<life_eventsUpdateManyMutationInput, life_eventsUncheckedUpdateManyWithoutUserInput>
  }

  export type life_eventsScalarWhereInput = {
    AND?: life_eventsScalarWhereInput | life_eventsScalarWhereInput[]
    OR?: life_eventsScalarWhereInput[]
    NOT?: life_eventsScalarWhereInput | life_eventsScalarWhereInput[]
    id?: IntFilter<"life_events"> | number
    userId?: IntFilter<"life_events"> | number
    person_id?: IntNullableFilter<"life_events"> | number | null
    event_id?: IntNullableFilter<"life_events"> | number | null
    title?: StringNullableFilter<"life_events"> | string | null
    start_date?: DateTimeNullableFilter<"life_events"> | Date | string | null
    end_date?: DateTimeNullableFilter<"life_events"> | Date | string | null
    location?: StringNullableFilter<"life_events"> | string | null
    description?: StringNullableFilter<"life_events"> | string | null
    metadata?: JsonNullableFilter<"life_events">
    event_type_id?: IntNullableFilter<"life_events"> | number | null
  }

  export type event_typesUpsertWithWhereUniqueWithoutUserInput = {
    where: event_typesWhereUniqueInput
    update: XOR<event_typesUpdateWithoutUserInput, event_typesUncheckedUpdateWithoutUserInput>
    create: XOR<event_typesCreateWithoutUserInput, event_typesUncheckedCreateWithoutUserInput>
  }

  export type event_typesUpdateWithWhereUniqueWithoutUserInput = {
    where: event_typesWhereUniqueInput
    data: XOR<event_typesUpdateWithoutUserInput, event_typesUncheckedUpdateWithoutUserInput>
  }

  export type event_typesUpdateManyWithWhereWithoutUserInput = {
    where: event_typesScalarWhereInput
    data: XOR<event_typesUpdateManyMutationInput, event_typesUncheckedUpdateManyWithoutUserInput>
  }

  export type event_typesScalarWhereInput = {
    AND?: event_typesScalarWhereInput | event_typesScalarWhereInput[]
    OR?: event_typesScalarWhereInput[]
    NOT?: event_typesScalarWhereInput | event_typesScalarWhereInput[]
    id?: IntFilter<"event_types"> | number
    userId?: IntFilter<"event_types"> | number
    name?: StringNullableFilter<"event_types"> | string | null
    icon?: StringNullableFilter<"event_types"> | string | null
    color?: StringNullableFilter<"event_types"> | string | null
  }

  export type literatureUpsertWithWhereUniqueWithoutUserInput = {
    where: literatureWhereUniqueInput
    update: XOR<literatureUpdateWithoutUserInput, literatureUncheckedUpdateWithoutUserInput>
    create: XOR<literatureCreateWithoutUserInput, literatureUncheckedCreateWithoutUserInput>
  }

  export type literatureUpdateWithWhereUniqueWithoutUserInput = {
    where: literatureWhereUniqueInput
    data: XOR<literatureUpdateWithoutUserInput, literatureUncheckedUpdateWithoutUserInput>
  }

  export type literatureUpdateManyWithWhereWithoutUserInput = {
    where: literatureScalarWhereInput
    data: XOR<literatureUpdateManyMutationInput, literatureUncheckedUpdateManyWithoutUserInput>
  }

  export type literatureScalarWhereInput = {
    AND?: literatureScalarWhereInput | literatureScalarWhereInput[]
    OR?: literatureScalarWhereInput[]
    NOT?: literatureScalarWhereInput | literatureScalarWhereInput[]
    id?: IntFilter<"literature"> | number
    userId?: IntFilter<"literature"> | number
    title?: StringFilter<"literature"> | string
    author?: StringFilter<"literature"> | string
    publicationYear?: IntNullableFilter<"literature"> | number | null
    type?: StringFilter<"literature"> | string
    description?: StringNullableFilter<"literature"> | string | null
    url?: StringNullableFilter<"literature"> | string | null
    publisher?: StringNullableFilter<"literature"> | string | null
    journal?: StringNullableFilter<"literature"> | string | null
    volume?: StringNullableFilter<"literature"> | string | null
    issue?: StringNullableFilter<"literature"> | string | null
    pages?: StringNullableFilter<"literature"> | string | null
    doi?: StringNullableFilter<"literature"> | string | null
    isbn?: StringNullableFilter<"literature"> | string | null
    issn?: StringNullableFilter<"literature"> | string | null
    language?: StringNullableFilter<"literature"> | string | null
    keywords?: StringNullableFilter<"literature"> | string | null
    abstract?: StringNullableFilter<"literature"> | string | null
    externalId?: StringNullableFilter<"literature"> | string | null
    syncSource?: StringNullableFilter<"literature"> | string | null
    lastSyncedAt?: DateTimeNullableFilter<"literature"> | Date | string | null
    syncMetadata?: JsonNullableFilter<"literature">
    createdAt?: DateTimeFilter<"literature"> | Date | string
    updatedAt?: DateTimeFilter<"literature"> | Date | string
  }

  export type BibliographySyncUpsertWithWhereUniqueWithoutUserInput = {
    where: BibliographySyncWhereUniqueInput
    update: XOR<BibliographySyncUpdateWithoutUserInput, BibliographySyncUncheckedUpdateWithoutUserInput>
    create: XOR<BibliographySyncCreateWithoutUserInput, BibliographySyncUncheckedCreateWithoutUserInput>
  }

  export type BibliographySyncUpdateWithWhereUniqueWithoutUserInput = {
    where: BibliographySyncWhereUniqueInput
    data: XOR<BibliographySyncUpdateWithoutUserInput, BibliographySyncUncheckedUpdateWithoutUserInput>
  }

  export type BibliographySyncUpdateManyWithWhereWithoutUserInput = {
    where: BibliographySyncScalarWhereInput
    data: XOR<BibliographySyncUpdateManyMutationInput, BibliographySyncUncheckedUpdateManyWithoutUserInput>
  }

  export type BibliographySyncScalarWhereInput = {
    AND?: BibliographySyncScalarWhereInput | BibliographySyncScalarWhereInput[]
    OR?: BibliographySyncScalarWhereInput[]
    NOT?: BibliographySyncScalarWhereInput | BibliographySyncScalarWhereInput[]
    id?: IntFilter<"BibliographySync"> | number
    userId?: IntFilter<"BibliographySync"> | number
    service?: StringFilter<"BibliographySync"> | string
    name?: StringFilter<"BibliographySync"> | string
    isActive?: BoolFilter<"BibliographySync"> | boolean
    apiKey?: StringNullableFilter<"BibliographySync"> | string | null
    apiSecret?: StringNullableFilter<"BibliographySync"> | string | null
    accessToken?: StringNullableFilter<"BibliographySync"> | string | null
    refreshToken?: StringNullableFilter<"BibliographySync"> | string | null
    tokenExpiresAt?: DateTimeNullableFilter<"BibliographySync"> | Date | string | null
    collectionId?: StringNullableFilter<"BibliographySync"> | string | null
    collectionName?: StringNullableFilter<"BibliographySync"> | string | null
    autoSync?: BoolFilter<"BibliographySync"> | boolean
    syncInterval?: IntNullableFilter<"BibliographySync"> | number | null
    lastSyncAt?: DateTimeNullableFilter<"BibliographySync"> | Date | string | null
    syncMetadata?: JsonNullableFilter<"BibliographySync">
    createdAt?: DateTimeFilter<"BibliographySync"> | Date | string
    updatedAt?: DateTimeFilter<"BibliographySync"> | Date | string
  }

  export type UserCreateWithoutEmailConfirmationsInput = {
    email: string
    name: string
    password: string
    role?: $Enums.UserRole
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastLoginAt?: Date | string | null
    passwordResets?: PasswordResetCreateNestedManyWithoutUserInput
    refreshTokens?: RefreshTokenCreateNestedManyWithoutUserInput
    events?: eventsCreateNestedManyWithoutUserInput
    persons?: personsCreateNestedManyWithoutUserInput
    life_events?: life_eventsCreateNestedManyWithoutUserInput
    event_types?: event_typesCreateNestedManyWithoutUserInput
    literature?: literatureCreateNestedManyWithoutUserInput
    bibliographySyncs?: BibliographySyncCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutEmailConfirmationsInput = {
    id?: number
    email: string
    name: string
    password: string
    role?: $Enums.UserRole
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastLoginAt?: Date | string | null
    passwordResets?: PasswordResetUncheckedCreateNestedManyWithoutUserInput
    refreshTokens?: RefreshTokenUncheckedCreateNestedManyWithoutUserInput
    events?: eventsUncheckedCreateNestedManyWithoutUserInput
    persons?: personsUncheckedCreateNestedManyWithoutUserInput
    life_events?: life_eventsUncheckedCreateNestedManyWithoutUserInput
    event_types?: event_typesUncheckedCreateNestedManyWithoutUserInput
    literature?: literatureUncheckedCreateNestedManyWithoutUserInput
    bibliographySyncs?: BibliographySyncUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutEmailConfirmationsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutEmailConfirmationsInput, UserUncheckedCreateWithoutEmailConfirmationsInput>
  }

  export type UserUpsertWithoutEmailConfirmationsInput = {
    update: XOR<UserUpdateWithoutEmailConfirmationsInput, UserUncheckedUpdateWithoutEmailConfirmationsInput>
    create: XOR<UserCreateWithoutEmailConfirmationsInput, UserUncheckedCreateWithoutEmailConfirmationsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutEmailConfirmationsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutEmailConfirmationsInput, UserUncheckedUpdateWithoutEmailConfirmationsInput>
  }

  export type UserUpdateWithoutEmailConfirmationsInput = {
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    passwordResets?: PasswordResetUpdateManyWithoutUserNestedInput
    refreshTokens?: RefreshTokenUpdateManyWithoutUserNestedInput
    events?: eventsUpdateManyWithoutUserNestedInput
    persons?: personsUpdateManyWithoutUserNestedInput
    life_events?: life_eventsUpdateManyWithoutUserNestedInput
    event_types?: event_typesUpdateManyWithoutUserNestedInput
    literature?: literatureUpdateManyWithoutUserNestedInput
    bibliographySyncs?: BibliographySyncUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutEmailConfirmationsInput = {
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    passwordResets?: PasswordResetUncheckedUpdateManyWithoutUserNestedInput
    refreshTokens?: RefreshTokenUncheckedUpdateManyWithoutUserNestedInput
    events?: eventsUncheckedUpdateManyWithoutUserNestedInput
    persons?: personsUncheckedUpdateManyWithoutUserNestedInput
    life_events?: life_eventsUncheckedUpdateManyWithoutUserNestedInput
    event_types?: event_typesUncheckedUpdateManyWithoutUserNestedInput
    literature?: literatureUncheckedUpdateManyWithoutUserNestedInput
    bibliographySyncs?: BibliographySyncUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateWithoutPasswordResetsInput = {
    email: string
    name: string
    password: string
    role?: $Enums.UserRole
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastLoginAt?: Date | string | null
    emailConfirmations?: EmailConfirmationCreateNestedManyWithoutUserInput
    refreshTokens?: RefreshTokenCreateNestedManyWithoutUserInput
    events?: eventsCreateNestedManyWithoutUserInput
    persons?: personsCreateNestedManyWithoutUserInput
    life_events?: life_eventsCreateNestedManyWithoutUserInput
    event_types?: event_typesCreateNestedManyWithoutUserInput
    literature?: literatureCreateNestedManyWithoutUserInput
    bibliographySyncs?: BibliographySyncCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutPasswordResetsInput = {
    id?: number
    email: string
    name: string
    password: string
    role?: $Enums.UserRole
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastLoginAt?: Date | string | null
    emailConfirmations?: EmailConfirmationUncheckedCreateNestedManyWithoutUserInput
    refreshTokens?: RefreshTokenUncheckedCreateNestedManyWithoutUserInput
    events?: eventsUncheckedCreateNestedManyWithoutUserInput
    persons?: personsUncheckedCreateNestedManyWithoutUserInput
    life_events?: life_eventsUncheckedCreateNestedManyWithoutUserInput
    event_types?: event_typesUncheckedCreateNestedManyWithoutUserInput
    literature?: literatureUncheckedCreateNestedManyWithoutUserInput
    bibliographySyncs?: BibliographySyncUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutPasswordResetsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutPasswordResetsInput, UserUncheckedCreateWithoutPasswordResetsInput>
  }

  export type UserUpsertWithoutPasswordResetsInput = {
    update: XOR<UserUpdateWithoutPasswordResetsInput, UserUncheckedUpdateWithoutPasswordResetsInput>
    create: XOR<UserCreateWithoutPasswordResetsInput, UserUncheckedCreateWithoutPasswordResetsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutPasswordResetsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutPasswordResetsInput, UserUncheckedUpdateWithoutPasswordResetsInput>
  }

  export type UserUpdateWithoutPasswordResetsInput = {
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailConfirmations?: EmailConfirmationUpdateManyWithoutUserNestedInput
    refreshTokens?: RefreshTokenUpdateManyWithoutUserNestedInput
    events?: eventsUpdateManyWithoutUserNestedInput
    persons?: personsUpdateManyWithoutUserNestedInput
    life_events?: life_eventsUpdateManyWithoutUserNestedInput
    event_types?: event_typesUpdateManyWithoutUserNestedInput
    literature?: literatureUpdateManyWithoutUserNestedInput
    bibliographySyncs?: BibliographySyncUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutPasswordResetsInput = {
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailConfirmations?: EmailConfirmationUncheckedUpdateManyWithoutUserNestedInput
    refreshTokens?: RefreshTokenUncheckedUpdateManyWithoutUserNestedInput
    events?: eventsUncheckedUpdateManyWithoutUserNestedInput
    persons?: personsUncheckedUpdateManyWithoutUserNestedInput
    life_events?: life_eventsUncheckedUpdateManyWithoutUserNestedInput
    event_types?: event_typesUncheckedUpdateManyWithoutUserNestedInput
    literature?: literatureUncheckedUpdateManyWithoutUserNestedInput
    bibliographySyncs?: BibliographySyncUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateWithoutRefreshTokensInput = {
    email: string
    name: string
    password: string
    role?: $Enums.UserRole
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastLoginAt?: Date | string | null
    emailConfirmations?: EmailConfirmationCreateNestedManyWithoutUserInput
    passwordResets?: PasswordResetCreateNestedManyWithoutUserInput
    events?: eventsCreateNestedManyWithoutUserInput
    persons?: personsCreateNestedManyWithoutUserInput
    life_events?: life_eventsCreateNestedManyWithoutUserInput
    event_types?: event_typesCreateNestedManyWithoutUserInput
    literature?: literatureCreateNestedManyWithoutUserInput
    bibliographySyncs?: BibliographySyncCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutRefreshTokensInput = {
    id?: number
    email: string
    name: string
    password: string
    role?: $Enums.UserRole
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastLoginAt?: Date | string | null
    emailConfirmations?: EmailConfirmationUncheckedCreateNestedManyWithoutUserInput
    passwordResets?: PasswordResetUncheckedCreateNestedManyWithoutUserInput
    events?: eventsUncheckedCreateNestedManyWithoutUserInput
    persons?: personsUncheckedCreateNestedManyWithoutUserInput
    life_events?: life_eventsUncheckedCreateNestedManyWithoutUserInput
    event_types?: event_typesUncheckedCreateNestedManyWithoutUserInput
    literature?: literatureUncheckedCreateNestedManyWithoutUserInput
    bibliographySyncs?: BibliographySyncUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutRefreshTokensInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutRefreshTokensInput, UserUncheckedCreateWithoutRefreshTokensInput>
  }

  export type UserUpsertWithoutRefreshTokensInput = {
    update: XOR<UserUpdateWithoutRefreshTokensInput, UserUncheckedUpdateWithoutRefreshTokensInput>
    create: XOR<UserCreateWithoutRefreshTokensInput, UserUncheckedCreateWithoutRefreshTokensInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutRefreshTokensInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutRefreshTokensInput, UserUncheckedUpdateWithoutRefreshTokensInput>
  }

  export type UserUpdateWithoutRefreshTokensInput = {
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailConfirmations?: EmailConfirmationUpdateManyWithoutUserNestedInput
    passwordResets?: PasswordResetUpdateManyWithoutUserNestedInput
    events?: eventsUpdateManyWithoutUserNestedInput
    persons?: personsUpdateManyWithoutUserNestedInput
    life_events?: life_eventsUpdateManyWithoutUserNestedInput
    event_types?: event_typesUpdateManyWithoutUserNestedInput
    literature?: literatureUpdateManyWithoutUserNestedInput
    bibliographySyncs?: BibliographySyncUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutRefreshTokensInput = {
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailConfirmations?: EmailConfirmationUncheckedUpdateManyWithoutUserNestedInput
    passwordResets?: PasswordResetUncheckedUpdateManyWithoutUserNestedInput
    events?: eventsUncheckedUpdateManyWithoutUserNestedInput
    persons?: personsUncheckedUpdateManyWithoutUserNestedInput
    life_events?: life_eventsUncheckedUpdateManyWithoutUserNestedInput
    event_types?: event_typesUncheckedUpdateManyWithoutUserNestedInput
    literature?: literatureUncheckedUpdateManyWithoutUserNestedInput
    bibliographySyncs?: BibliographySyncUncheckedUpdateManyWithoutUserNestedInput
  }

  export type life_eventsCreateWithoutEventInput = {
    title?: string | null
    start_date?: Date | string | null
    end_date?: Date | string | null
    location?: string | null
    description?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    event_type?: event_typesCreateNestedOneWithoutLife_eventsInput
    persons?: personsCreateNestedOneWithoutLife_eventsInput
    user: UserCreateNestedOneWithoutLife_eventsInput
  }

  export type life_eventsUncheckedCreateWithoutEventInput = {
    id?: number
    userId: number
    person_id?: number | null
    title?: string | null
    start_date?: Date | string | null
    end_date?: Date | string | null
    location?: string | null
    description?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    event_type_id?: number | null
  }

  export type life_eventsCreateOrConnectWithoutEventInput = {
    where: life_eventsWhereUniqueInput
    create: XOR<life_eventsCreateWithoutEventInput, life_eventsUncheckedCreateWithoutEventInput>
  }

  export type life_eventsCreateManyEventInputEnvelope = {
    data: life_eventsCreateManyEventInput | life_eventsCreateManyEventInput[]
    skipDuplicates?: boolean
  }

  export type UserCreateWithoutEventsInput = {
    email: string
    name: string
    password: string
    role?: $Enums.UserRole
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastLoginAt?: Date | string | null
    emailConfirmations?: EmailConfirmationCreateNestedManyWithoutUserInput
    passwordResets?: PasswordResetCreateNestedManyWithoutUserInput
    refreshTokens?: RefreshTokenCreateNestedManyWithoutUserInput
    persons?: personsCreateNestedManyWithoutUserInput
    life_events?: life_eventsCreateNestedManyWithoutUserInput
    event_types?: event_typesCreateNestedManyWithoutUserInput
    literature?: literatureCreateNestedManyWithoutUserInput
    bibliographySyncs?: BibliographySyncCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutEventsInput = {
    id?: number
    email: string
    name: string
    password: string
    role?: $Enums.UserRole
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastLoginAt?: Date | string | null
    emailConfirmations?: EmailConfirmationUncheckedCreateNestedManyWithoutUserInput
    passwordResets?: PasswordResetUncheckedCreateNestedManyWithoutUserInput
    refreshTokens?: RefreshTokenUncheckedCreateNestedManyWithoutUserInput
    persons?: personsUncheckedCreateNestedManyWithoutUserInput
    life_events?: life_eventsUncheckedCreateNestedManyWithoutUserInput
    event_types?: event_typesUncheckedCreateNestedManyWithoutUserInput
    literature?: literatureUncheckedCreateNestedManyWithoutUserInput
    bibliographySyncs?: BibliographySyncUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutEventsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutEventsInput, UserUncheckedCreateWithoutEventsInput>
  }

  export type life_eventsUpsertWithWhereUniqueWithoutEventInput = {
    where: life_eventsWhereUniqueInput
    update: XOR<life_eventsUpdateWithoutEventInput, life_eventsUncheckedUpdateWithoutEventInput>
    create: XOR<life_eventsCreateWithoutEventInput, life_eventsUncheckedCreateWithoutEventInput>
  }

  export type life_eventsUpdateWithWhereUniqueWithoutEventInput = {
    where: life_eventsWhereUniqueInput
    data: XOR<life_eventsUpdateWithoutEventInput, life_eventsUncheckedUpdateWithoutEventInput>
  }

  export type life_eventsUpdateManyWithWhereWithoutEventInput = {
    where: life_eventsScalarWhereInput
    data: XOR<life_eventsUpdateManyMutationInput, life_eventsUncheckedUpdateManyWithoutEventInput>
  }

  export type UserUpsertWithoutEventsInput = {
    update: XOR<UserUpdateWithoutEventsInput, UserUncheckedUpdateWithoutEventsInput>
    create: XOR<UserCreateWithoutEventsInput, UserUncheckedCreateWithoutEventsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutEventsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutEventsInput, UserUncheckedUpdateWithoutEventsInput>
  }

  export type UserUpdateWithoutEventsInput = {
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailConfirmations?: EmailConfirmationUpdateManyWithoutUserNestedInput
    passwordResets?: PasswordResetUpdateManyWithoutUserNestedInput
    refreshTokens?: RefreshTokenUpdateManyWithoutUserNestedInput
    persons?: personsUpdateManyWithoutUserNestedInput
    life_events?: life_eventsUpdateManyWithoutUserNestedInput
    event_types?: event_typesUpdateManyWithoutUserNestedInput
    literature?: literatureUpdateManyWithoutUserNestedInput
    bibliographySyncs?: BibliographySyncUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutEventsInput = {
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailConfirmations?: EmailConfirmationUncheckedUpdateManyWithoutUserNestedInput
    passwordResets?: PasswordResetUncheckedUpdateManyWithoutUserNestedInput
    refreshTokens?: RefreshTokenUncheckedUpdateManyWithoutUserNestedInput
    persons?: personsUncheckedUpdateManyWithoutUserNestedInput
    life_events?: life_eventsUncheckedUpdateManyWithoutUserNestedInput
    event_types?: event_typesUncheckedUpdateManyWithoutUserNestedInput
    literature?: literatureUncheckedUpdateManyWithoutUserNestedInput
    bibliographySyncs?: BibliographySyncUncheckedUpdateManyWithoutUserNestedInput
  }

  export type life_eventsCreateWithoutEvent_typeInput = {
    title?: string | null
    start_date?: Date | string | null
    end_date?: Date | string | null
    location?: string | null
    description?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    event?: eventsCreateNestedOneWithoutLife_eventsInput
    persons?: personsCreateNestedOneWithoutLife_eventsInput
    user: UserCreateNestedOneWithoutLife_eventsInput
  }

  export type life_eventsUncheckedCreateWithoutEvent_typeInput = {
    id?: number
    userId: number
    person_id?: number | null
    event_id?: number | null
    title?: string | null
    start_date?: Date | string | null
    end_date?: Date | string | null
    location?: string | null
    description?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type life_eventsCreateOrConnectWithoutEvent_typeInput = {
    where: life_eventsWhereUniqueInput
    create: XOR<life_eventsCreateWithoutEvent_typeInput, life_eventsUncheckedCreateWithoutEvent_typeInput>
  }

  export type life_eventsCreateManyEvent_typeInputEnvelope = {
    data: life_eventsCreateManyEvent_typeInput | life_eventsCreateManyEvent_typeInput[]
    skipDuplicates?: boolean
  }

  export type UserCreateWithoutEvent_typesInput = {
    email: string
    name: string
    password: string
    role?: $Enums.UserRole
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastLoginAt?: Date | string | null
    emailConfirmations?: EmailConfirmationCreateNestedManyWithoutUserInput
    passwordResets?: PasswordResetCreateNestedManyWithoutUserInput
    refreshTokens?: RefreshTokenCreateNestedManyWithoutUserInput
    events?: eventsCreateNestedManyWithoutUserInput
    persons?: personsCreateNestedManyWithoutUserInput
    life_events?: life_eventsCreateNestedManyWithoutUserInput
    literature?: literatureCreateNestedManyWithoutUserInput
    bibliographySyncs?: BibliographySyncCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutEvent_typesInput = {
    id?: number
    email: string
    name: string
    password: string
    role?: $Enums.UserRole
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastLoginAt?: Date | string | null
    emailConfirmations?: EmailConfirmationUncheckedCreateNestedManyWithoutUserInput
    passwordResets?: PasswordResetUncheckedCreateNestedManyWithoutUserInput
    refreshTokens?: RefreshTokenUncheckedCreateNestedManyWithoutUserInput
    events?: eventsUncheckedCreateNestedManyWithoutUserInput
    persons?: personsUncheckedCreateNestedManyWithoutUserInput
    life_events?: life_eventsUncheckedCreateNestedManyWithoutUserInput
    literature?: literatureUncheckedCreateNestedManyWithoutUserInput
    bibliographySyncs?: BibliographySyncUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutEvent_typesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutEvent_typesInput, UserUncheckedCreateWithoutEvent_typesInput>
  }

  export type life_eventsUpsertWithWhereUniqueWithoutEvent_typeInput = {
    where: life_eventsWhereUniqueInput
    update: XOR<life_eventsUpdateWithoutEvent_typeInput, life_eventsUncheckedUpdateWithoutEvent_typeInput>
    create: XOR<life_eventsCreateWithoutEvent_typeInput, life_eventsUncheckedCreateWithoutEvent_typeInput>
  }

  export type life_eventsUpdateWithWhereUniqueWithoutEvent_typeInput = {
    where: life_eventsWhereUniqueInput
    data: XOR<life_eventsUpdateWithoutEvent_typeInput, life_eventsUncheckedUpdateWithoutEvent_typeInput>
  }

  export type life_eventsUpdateManyWithWhereWithoutEvent_typeInput = {
    where: life_eventsScalarWhereInput
    data: XOR<life_eventsUpdateManyMutationInput, life_eventsUncheckedUpdateManyWithoutEvent_typeInput>
  }

  export type UserUpsertWithoutEvent_typesInput = {
    update: XOR<UserUpdateWithoutEvent_typesInput, UserUncheckedUpdateWithoutEvent_typesInput>
    create: XOR<UserCreateWithoutEvent_typesInput, UserUncheckedCreateWithoutEvent_typesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutEvent_typesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutEvent_typesInput, UserUncheckedUpdateWithoutEvent_typesInput>
  }

  export type UserUpdateWithoutEvent_typesInput = {
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailConfirmations?: EmailConfirmationUpdateManyWithoutUserNestedInput
    passwordResets?: PasswordResetUpdateManyWithoutUserNestedInput
    refreshTokens?: RefreshTokenUpdateManyWithoutUserNestedInput
    events?: eventsUpdateManyWithoutUserNestedInput
    persons?: personsUpdateManyWithoutUserNestedInput
    life_events?: life_eventsUpdateManyWithoutUserNestedInput
    literature?: literatureUpdateManyWithoutUserNestedInput
    bibliographySyncs?: BibliographySyncUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutEvent_typesInput = {
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailConfirmations?: EmailConfirmationUncheckedUpdateManyWithoutUserNestedInput
    passwordResets?: PasswordResetUncheckedUpdateManyWithoutUserNestedInput
    refreshTokens?: RefreshTokenUncheckedUpdateManyWithoutUserNestedInput
    events?: eventsUncheckedUpdateManyWithoutUserNestedInput
    persons?: personsUncheckedUpdateManyWithoutUserNestedInput
    life_events?: life_eventsUncheckedUpdateManyWithoutUserNestedInput
    literature?: literatureUncheckedUpdateManyWithoutUserNestedInput
    bibliographySyncs?: BibliographySyncUncheckedUpdateManyWithoutUserNestedInput
  }

  export type eventsCreateWithoutLife_eventsInput = {
    title: string
    description?: string | null
    date?: Date | string | null
    end_date?: Date | string | null
    location?: string | null
    user: UserCreateNestedOneWithoutEventsInput
  }

  export type eventsUncheckedCreateWithoutLife_eventsInput = {
    id?: number
    userId: number
    title: string
    description?: string | null
    date?: Date | string | null
    end_date?: Date | string | null
    location?: string | null
  }

  export type eventsCreateOrConnectWithoutLife_eventsInput = {
    where: eventsWhereUniqueInput
    create: XOR<eventsCreateWithoutLife_eventsInput, eventsUncheckedCreateWithoutLife_eventsInput>
  }

  export type event_typesCreateWithoutLife_eventsInput = {
    name?: string | null
    icon?: string | null
    color?: string | null
    user: UserCreateNestedOneWithoutEvent_typesInput
  }

  export type event_typesUncheckedCreateWithoutLife_eventsInput = {
    id?: number
    userId: number
    name?: string | null
    icon?: string | null
    color?: string | null
  }

  export type event_typesCreateOrConnectWithoutLife_eventsInput = {
    where: event_typesWhereUniqueInput
    create: XOR<event_typesCreateWithoutLife_eventsInput, event_typesUncheckedCreateWithoutLife_eventsInput>
  }

  export type personsCreateWithoutLife_eventsInput = {
    first_name?: string | null
    last_name?: string | null
    birth_date?: Date | string | null
    birth_place?: string | null
    death_date?: Date | string | null
    death_place?: string | null
    notes?: string | null
    user: UserCreateNestedOneWithoutPersonsInput
    relations_from?: person_relationsCreateNestedManyWithoutFrom_personInput
    relations_to?: person_relationsCreateNestedManyWithoutTo_personInput
  }

  export type personsUncheckedCreateWithoutLife_eventsInput = {
    id?: number
    userId: number
    first_name?: string | null
    last_name?: string | null
    birth_date?: Date | string | null
    birth_place?: string | null
    death_date?: Date | string | null
    death_place?: string | null
    notes?: string | null
    relations_from?: person_relationsUncheckedCreateNestedManyWithoutFrom_personInput
    relations_to?: person_relationsUncheckedCreateNestedManyWithoutTo_personInput
  }

  export type personsCreateOrConnectWithoutLife_eventsInput = {
    where: personsWhereUniqueInput
    create: XOR<personsCreateWithoutLife_eventsInput, personsUncheckedCreateWithoutLife_eventsInput>
  }

  export type UserCreateWithoutLife_eventsInput = {
    email: string
    name: string
    password: string
    role?: $Enums.UserRole
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastLoginAt?: Date | string | null
    emailConfirmations?: EmailConfirmationCreateNestedManyWithoutUserInput
    passwordResets?: PasswordResetCreateNestedManyWithoutUserInput
    refreshTokens?: RefreshTokenCreateNestedManyWithoutUserInput
    events?: eventsCreateNestedManyWithoutUserInput
    persons?: personsCreateNestedManyWithoutUserInput
    event_types?: event_typesCreateNestedManyWithoutUserInput
    literature?: literatureCreateNestedManyWithoutUserInput
    bibliographySyncs?: BibliographySyncCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutLife_eventsInput = {
    id?: number
    email: string
    name: string
    password: string
    role?: $Enums.UserRole
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastLoginAt?: Date | string | null
    emailConfirmations?: EmailConfirmationUncheckedCreateNestedManyWithoutUserInput
    passwordResets?: PasswordResetUncheckedCreateNestedManyWithoutUserInput
    refreshTokens?: RefreshTokenUncheckedCreateNestedManyWithoutUserInput
    events?: eventsUncheckedCreateNestedManyWithoutUserInput
    persons?: personsUncheckedCreateNestedManyWithoutUserInput
    event_types?: event_typesUncheckedCreateNestedManyWithoutUserInput
    literature?: literatureUncheckedCreateNestedManyWithoutUserInput
    bibliographySyncs?: BibliographySyncUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutLife_eventsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutLife_eventsInput, UserUncheckedCreateWithoutLife_eventsInput>
  }

  export type eventsUpsertWithoutLife_eventsInput = {
    update: XOR<eventsUpdateWithoutLife_eventsInput, eventsUncheckedUpdateWithoutLife_eventsInput>
    create: XOR<eventsCreateWithoutLife_eventsInput, eventsUncheckedCreateWithoutLife_eventsInput>
    where?: eventsWhereInput
  }

  export type eventsUpdateToOneWithWhereWithoutLife_eventsInput = {
    where?: eventsWhereInput
    data: XOR<eventsUpdateWithoutLife_eventsInput, eventsUncheckedUpdateWithoutLife_eventsInput>
  }

  export type eventsUpdateWithoutLife_eventsInput = {
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    user?: UserUpdateOneRequiredWithoutEventsNestedInput
  }

  export type eventsUncheckedUpdateWithoutLife_eventsInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type event_typesUpsertWithoutLife_eventsInput = {
    update: XOR<event_typesUpdateWithoutLife_eventsInput, event_typesUncheckedUpdateWithoutLife_eventsInput>
    create: XOR<event_typesCreateWithoutLife_eventsInput, event_typesUncheckedCreateWithoutLife_eventsInput>
    where?: event_typesWhereInput
  }

  export type event_typesUpdateToOneWithWhereWithoutLife_eventsInput = {
    where?: event_typesWhereInput
    data: XOR<event_typesUpdateWithoutLife_eventsInput, event_typesUncheckedUpdateWithoutLife_eventsInput>
  }

  export type event_typesUpdateWithoutLife_eventsInput = {
    name?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    user?: UserUpdateOneRequiredWithoutEvent_typesNestedInput
  }

  export type event_typesUncheckedUpdateWithoutLife_eventsInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    name?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type personsUpsertWithoutLife_eventsInput = {
    update: XOR<personsUpdateWithoutLife_eventsInput, personsUncheckedUpdateWithoutLife_eventsInput>
    create: XOR<personsCreateWithoutLife_eventsInput, personsUncheckedCreateWithoutLife_eventsInput>
    where?: personsWhereInput
  }

  export type personsUpdateToOneWithWhereWithoutLife_eventsInput = {
    where?: personsWhereInput
    data: XOR<personsUpdateWithoutLife_eventsInput, personsUncheckedUpdateWithoutLife_eventsInput>
  }

  export type personsUpdateWithoutLife_eventsInput = {
    first_name?: NullableStringFieldUpdateOperationsInput | string | null
    last_name?: NullableStringFieldUpdateOperationsInput | string | null
    birth_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    birth_place?: NullableStringFieldUpdateOperationsInput | string | null
    death_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    death_place?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    user?: UserUpdateOneRequiredWithoutPersonsNestedInput
    relations_from?: person_relationsUpdateManyWithoutFrom_personNestedInput
    relations_to?: person_relationsUpdateManyWithoutTo_personNestedInput
  }

  export type personsUncheckedUpdateWithoutLife_eventsInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    first_name?: NullableStringFieldUpdateOperationsInput | string | null
    last_name?: NullableStringFieldUpdateOperationsInput | string | null
    birth_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    birth_place?: NullableStringFieldUpdateOperationsInput | string | null
    death_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    death_place?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    relations_from?: person_relationsUncheckedUpdateManyWithoutFrom_personNestedInput
    relations_to?: person_relationsUncheckedUpdateManyWithoutTo_personNestedInput
  }

  export type UserUpsertWithoutLife_eventsInput = {
    update: XOR<UserUpdateWithoutLife_eventsInput, UserUncheckedUpdateWithoutLife_eventsInput>
    create: XOR<UserCreateWithoutLife_eventsInput, UserUncheckedCreateWithoutLife_eventsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutLife_eventsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutLife_eventsInput, UserUncheckedUpdateWithoutLife_eventsInput>
  }

  export type UserUpdateWithoutLife_eventsInput = {
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailConfirmations?: EmailConfirmationUpdateManyWithoutUserNestedInput
    passwordResets?: PasswordResetUpdateManyWithoutUserNestedInput
    refreshTokens?: RefreshTokenUpdateManyWithoutUserNestedInput
    events?: eventsUpdateManyWithoutUserNestedInput
    persons?: personsUpdateManyWithoutUserNestedInput
    event_types?: event_typesUpdateManyWithoutUserNestedInput
    literature?: literatureUpdateManyWithoutUserNestedInput
    bibliographySyncs?: BibliographySyncUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutLife_eventsInput = {
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailConfirmations?: EmailConfirmationUncheckedUpdateManyWithoutUserNestedInput
    passwordResets?: PasswordResetUncheckedUpdateManyWithoutUserNestedInput
    refreshTokens?: RefreshTokenUncheckedUpdateManyWithoutUserNestedInput
    events?: eventsUncheckedUpdateManyWithoutUserNestedInput
    persons?: personsUncheckedUpdateManyWithoutUserNestedInput
    event_types?: event_typesUncheckedUpdateManyWithoutUserNestedInput
    literature?: literatureUncheckedUpdateManyWithoutUserNestedInput
    bibliographySyncs?: BibliographySyncUncheckedUpdateManyWithoutUserNestedInput
  }

  export type life_eventsCreateWithoutPersonsInput = {
    title?: string | null
    start_date?: Date | string | null
    end_date?: Date | string | null
    location?: string | null
    description?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    event?: eventsCreateNestedOneWithoutLife_eventsInput
    event_type?: event_typesCreateNestedOneWithoutLife_eventsInput
    user: UserCreateNestedOneWithoutLife_eventsInput
  }

  export type life_eventsUncheckedCreateWithoutPersonsInput = {
    id?: number
    userId: number
    event_id?: number | null
    title?: string | null
    start_date?: Date | string | null
    end_date?: Date | string | null
    location?: string | null
    description?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    event_type_id?: number | null
  }

  export type life_eventsCreateOrConnectWithoutPersonsInput = {
    where: life_eventsWhereUniqueInput
    create: XOR<life_eventsCreateWithoutPersonsInput, life_eventsUncheckedCreateWithoutPersonsInput>
  }

  export type life_eventsCreateManyPersonsInputEnvelope = {
    data: life_eventsCreateManyPersonsInput | life_eventsCreateManyPersonsInput[]
    skipDuplicates?: boolean
  }

  export type UserCreateWithoutPersonsInput = {
    email: string
    name: string
    password: string
    role?: $Enums.UserRole
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastLoginAt?: Date | string | null
    emailConfirmations?: EmailConfirmationCreateNestedManyWithoutUserInput
    passwordResets?: PasswordResetCreateNestedManyWithoutUserInput
    refreshTokens?: RefreshTokenCreateNestedManyWithoutUserInput
    events?: eventsCreateNestedManyWithoutUserInput
    life_events?: life_eventsCreateNestedManyWithoutUserInput
    event_types?: event_typesCreateNestedManyWithoutUserInput
    literature?: literatureCreateNestedManyWithoutUserInput
    bibliographySyncs?: BibliographySyncCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutPersonsInput = {
    id?: number
    email: string
    name: string
    password: string
    role?: $Enums.UserRole
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastLoginAt?: Date | string | null
    emailConfirmations?: EmailConfirmationUncheckedCreateNestedManyWithoutUserInput
    passwordResets?: PasswordResetUncheckedCreateNestedManyWithoutUserInput
    refreshTokens?: RefreshTokenUncheckedCreateNestedManyWithoutUserInput
    events?: eventsUncheckedCreateNestedManyWithoutUserInput
    life_events?: life_eventsUncheckedCreateNestedManyWithoutUserInput
    event_types?: event_typesUncheckedCreateNestedManyWithoutUserInput
    literature?: literatureUncheckedCreateNestedManyWithoutUserInput
    bibliographySyncs?: BibliographySyncUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutPersonsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutPersonsInput, UserUncheckedCreateWithoutPersonsInput>
  }

  export type person_relationsCreateWithoutFrom_personInput = {
    relation_type: string
    notes?: string | null
    to_person: personsCreateNestedOneWithoutRelations_toInput
  }

  export type person_relationsUncheckedCreateWithoutFrom_personInput = {
    id?: number
    to_person_id: number
    relation_type: string
    notes?: string | null
  }

  export type person_relationsCreateOrConnectWithoutFrom_personInput = {
    where: person_relationsWhereUniqueInput
    create: XOR<person_relationsCreateWithoutFrom_personInput, person_relationsUncheckedCreateWithoutFrom_personInput>
  }

  export type person_relationsCreateManyFrom_personInputEnvelope = {
    data: person_relationsCreateManyFrom_personInput | person_relationsCreateManyFrom_personInput[]
    skipDuplicates?: boolean
  }

  export type person_relationsCreateWithoutTo_personInput = {
    relation_type: string
    notes?: string | null
    from_person: personsCreateNestedOneWithoutRelations_fromInput
  }

  export type person_relationsUncheckedCreateWithoutTo_personInput = {
    id?: number
    from_person_id: number
    relation_type: string
    notes?: string | null
  }

  export type person_relationsCreateOrConnectWithoutTo_personInput = {
    where: person_relationsWhereUniqueInput
    create: XOR<person_relationsCreateWithoutTo_personInput, person_relationsUncheckedCreateWithoutTo_personInput>
  }

  export type person_relationsCreateManyTo_personInputEnvelope = {
    data: person_relationsCreateManyTo_personInput | person_relationsCreateManyTo_personInput[]
    skipDuplicates?: boolean
  }

  export type life_eventsUpsertWithWhereUniqueWithoutPersonsInput = {
    where: life_eventsWhereUniqueInput
    update: XOR<life_eventsUpdateWithoutPersonsInput, life_eventsUncheckedUpdateWithoutPersonsInput>
    create: XOR<life_eventsCreateWithoutPersonsInput, life_eventsUncheckedCreateWithoutPersonsInput>
  }

  export type life_eventsUpdateWithWhereUniqueWithoutPersonsInput = {
    where: life_eventsWhereUniqueInput
    data: XOR<life_eventsUpdateWithoutPersonsInput, life_eventsUncheckedUpdateWithoutPersonsInput>
  }

  export type life_eventsUpdateManyWithWhereWithoutPersonsInput = {
    where: life_eventsScalarWhereInput
    data: XOR<life_eventsUpdateManyMutationInput, life_eventsUncheckedUpdateManyWithoutPersonsInput>
  }

  export type UserUpsertWithoutPersonsInput = {
    update: XOR<UserUpdateWithoutPersonsInput, UserUncheckedUpdateWithoutPersonsInput>
    create: XOR<UserCreateWithoutPersonsInput, UserUncheckedCreateWithoutPersonsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutPersonsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutPersonsInput, UserUncheckedUpdateWithoutPersonsInput>
  }

  export type UserUpdateWithoutPersonsInput = {
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailConfirmations?: EmailConfirmationUpdateManyWithoutUserNestedInput
    passwordResets?: PasswordResetUpdateManyWithoutUserNestedInput
    refreshTokens?: RefreshTokenUpdateManyWithoutUserNestedInput
    events?: eventsUpdateManyWithoutUserNestedInput
    life_events?: life_eventsUpdateManyWithoutUserNestedInput
    event_types?: event_typesUpdateManyWithoutUserNestedInput
    literature?: literatureUpdateManyWithoutUserNestedInput
    bibliographySyncs?: BibliographySyncUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutPersonsInput = {
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailConfirmations?: EmailConfirmationUncheckedUpdateManyWithoutUserNestedInput
    passwordResets?: PasswordResetUncheckedUpdateManyWithoutUserNestedInput
    refreshTokens?: RefreshTokenUncheckedUpdateManyWithoutUserNestedInput
    events?: eventsUncheckedUpdateManyWithoutUserNestedInput
    life_events?: life_eventsUncheckedUpdateManyWithoutUserNestedInput
    event_types?: event_typesUncheckedUpdateManyWithoutUserNestedInput
    literature?: literatureUncheckedUpdateManyWithoutUserNestedInput
    bibliographySyncs?: BibliographySyncUncheckedUpdateManyWithoutUserNestedInput
  }

  export type person_relationsUpsertWithWhereUniqueWithoutFrom_personInput = {
    where: person_relationsWhereUniqueInput
    update: XOR<person_relationsUpdateWithoutFrom_personInput, person_relationsUncheckedUpdateWithoutFrom_personInput>
    create: XOR<person_relationsCreateWithoutFrom_personInput, person_relationsUncheckedCreateWithoutFrom_personInput>
  }

  export type person_relationsUpdateWithWhereUniqueWithoutFrom_personInput = {
    where: person_relationsWhereUniqueInput
    data: XOR<person_relationsUpdateWithoutFrom_personInput, person_relationsUncheckedUpdateWithoutFrom_personInput>
  }

  export type person_relationsUpdateManyWithWhereWithoutFrom_personInput = {
    where: person_relationsScalarWhereInput
    data: XOR<person_relationsUpdateManyMutationInput, person_relationsUncheckedUpdateManyWithoutFrom_personInput>
  }

  export type person_relationsScalarWhereInput = {
    AND?: person_relationsScalarWhereInput | person_relationsScalarWhereInput[]
    OR?: person_relationsScalarWhereInput[]
    NOT?: person_relationsScalarWhereInput | person_relationsScalarWhereInput[]
    id?: IntFilter<"person_relations"> | number
    from_person_id?: IntFilter<"person_relations"> | number
    to_person_id?: IntFilter<"person_relations"> | number
    relation_type?: StringFilter<"person_relations"> | string
    notes?: StringNullableFilter<"person_relations"> | string | null
  }

  export type person_relationsUpsertWithWhereUniqueWithoutTo_personInput = {
    where: person_relationsWhereUniqueInput
    update: XOR<person_relationsUpdateWithoutTo_personInput, person_relationsUncheckedUpdateWithoutTo_personInput>
    create: XOR<person_relationsCreateWithoutTo_personInput, person_relationsUncheckedCreateWithoutTo_personInput>
  }

  export type person_relationsUpdateWithWhereUniqueWithoutTo_personInput = {
    where: person_relationsWhereUniqueInput
    data: XOR<person_relationsUpdateWithoutTo_personInput, person_relationsUncheckedUpdateWithoutTo_personInput>
  }

  export type person_relationsUpdateManyWithWhereWithoutTo_personInput = {
    where: person_relationsScalarWhereInput
    data: XOR<person_relationsUpdateManyMutationInput, person_relationsUncheckedUpdateManyWithoutTo_personInput>
  }

  export type personsCreateWithoutRelations_fromInput = {
    first_name?: string | null
    last_name?: string | null
    birth_date?: Date | string | null
    birth_place?: string | null
    death_date?: Date | string | null
    death_place?: string | null
    notes?: string | null
    life_events?: life_eventsCreateNestedManyWithoutPersonsInput
    user: UserCreateNestedOneWithoutPersonsInput
    relations_to?: person_relationsCreateNestedManyWithoutTo_personInput
  }

  export type personsUncheckedCreateWithoutRelations_fromInput = {
    id?: number
    userId: number
    first_name?: string | null
    last_name?: string | null
    birth_date?: Date | string | null
    birth_place?: string | null
    death_date?: Date | string | null
    death_place?: string | null
    notes?: string | null
    life_events?: life_eventsUncheckedCreateNestedManyWithoutPersonsInput
    relations_to?: person_relationsUncheckedCreateNestedManyWithoutTo_personInput
  }

  export type personsCreateOrConnectWithoutRelations_fromInput = {
    where: personsWhereUniqueInput
    create: XOR<personsCreateWithoutRelations_fromInput, personsUncheckedCreateWithoutRelations_fromInput>
  }

  export type personsCreateWithoutRelations_toInput = {
    first_name?: string | null
    last_name?: string | null
    birth_date?: Date | string | null
    birth_place?: string | null
    death_date?: Date | string | null
    death_place?: string | null
    notes?: string | null
    life_events?: life_eventsCreateNestedManyWithoutPersonsInput
    user: UserCreateNestedOneWithoutPersonsInput
    relations_from?: person_relationsCreateNestedManyWithoutFrom_personInput
  }

  export type personsUncheckedCreateWithoutRelations_toInput = {
    id?: number
    userId: number
    first_name?: string | null
    last_name?: string | null
    birth_date?: Date | string | null
    birth_place?: string | null
    death_date?: Date | string | null
    death_place?: string | null
    notes?: string | null
    life_events?: life_eventsUncheckedCreateNestedManyWithoutPersonsInput
    relations_from?: person_relationsUncheckedCreateNestedManyWithoutFrom_personInput
  }

  export type personsCreateOrConnectWithoutRelations_toInput = {
    where: personsWhereUniqueInput
    create: XOR<personsCreateWithoutRelations_toInput, personsUncheckedCreateWithoutRelations_toInput>
  }

  export type personsUpsertWithoutRelations_fromInput = {
    update: XOR<personsUpdateWithoutRelations_fromInput, personsUncheckedUpdateWithoutRelations_fromInput>
    create: XOR<personsCreateWithoutRelations_fromInput, personsUncheckedCreateWithoutRelations_fromInput>
    where?: personsWhereInput
  }

  export type personsUpdateToOneWithWhereWithoutRelations_fromInput = {
    where?: personsWhereInput
    data: XOR<personsUpdateWithoutRelations_fromInput, personsUncheckedUpdateWithoutRelations_fromInput>
  }

  export type personsUpdateWithoutRelations_fromInput = {
    first_name?: NullableStringFieldUpdateOperationsInput | string | null
    last_name?: NullableStringFieldUpdateOperationsInput | string | null
    birth_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    birth_place?: NullableStringFieldUpdateOperationsInput | string | null
    death_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    death_place?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    life_events?: life_eventsUpdateManyWithoutPersonsNestedInput
    user?: UserUpdateOneRequiredWithoutPersonsNestedInput
    relations_to?: person_relationsUpdateManyWithoutTo_personNestedInput
  }

  export type personsUncheckedUpdateWithoutRelations_fromInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    first_name?: NullableStringFieldUpdateOperationsInput | string | null
    last_name?: NullableStringFieldUpdateOperationsInput | string | null
    birth_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    birth_place?: NullableStringFieldUpdateOperationsInput | string | null
    death_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    death_place?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    life_events?: life_eventsUncheckedUpdateManyWithoutPersonsNestedInput
    relations_to?: person_relationsUncheckedUpdateManyWithoutTo_personNestedInput
  }

  export type personsUpsertWithoutRelations_toInput = {
    update: XOR<personsUpdateWithoutRelations_toInput, personsUncheckedUpdateWithoutRelations_toInput>
    create: XOR<personsCreateWithoutRelations_toInput, personsUncheckedCreateWithoutRelations_toInput>
    where?: personsWhereInput
  }

  export type personsUpdateToOneWithWhereWithoutRelations_toInput = {
    where?: personsWhereInput
    data: XOR<personsUpdateWithoutRelations_toInput, personsUncheckedUpdateWithoutRelations_toInput>
  }

  export type personsUpdateWithoutRelations_toInput = {
    first_name?: NullableStringFieldUpdateOperationsInput | string | null
    last_name?: NullableStringFieldUpdateOperationsInput | string | null
    birth_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    birth_place?: NullableStringFieldUpdateOperationsInput | string | null
    death_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    death_place?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    life_events?: life_eventsUpdateManyWithoutPersonsNestedInput
    user?: UserUpdateOneRequiredWithoutPersonsNestedInput
    relations_from?: person_relationsUpdateManyWithoutFrom_personNestedInput
  }

  export type personsUncheckedUpdateWithoutRelations_toInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    first_name?: NullableStringFieldUpdateOperationsInput | string | null
    last_name?: NullableStringFieldUpdateOperationsInput | string | null
    birth_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    birth_place?: NullableStringFieldUpdateOperationsInput | string | null
    death_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    death_place?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    life_events?: life_eventsUncheckedUpdateManyWithoutPersonsNestedInput
    relations_from?: person_relationsUncheckedUpdateManyWithoutFrom_personNestedInput
  }

  export type UserCreateWithoutLiteratureInput = {
    email: string
    name: string
    password: string
    role?: $Enums.UserRole
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastLoginAt?: Date | string | null
    emailConfirmations?: EmailConfirmationCreateNestedManyWithoutUserInput
    passwordResets?: PasswordResetCreateNestedManyWithoutUserInput
    refreshTokens?: RefreshTokenCreateNestedManyWithoutUserInput
    events?: eventsCreateNestedManyWithoutUserInput
    persons?: personsCreateNestedManyWithoutUserInput
    life_events?: life_eventsCreateNestedManyWithoutUserInput
    event_types?: event_typesCreateNestedManyWithoutUserInput
    bibliographySyncs?: BibliographySyncCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutLiteratureInput = {
    id?: number
    email: string
    name: string
    password: string
    role?: $Enums.UserRole
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastLoginAt?: Date | string | null
    emailConfirmations?: EmailConfirmationUncheckedCreateNestedManyWithoutUserInput
    passwordResets?: PasswordResetUncheckedCreateNestedManyWithoutUserInput
    refreshTokens?: RefreshTokenUncheckedCreateNestedManyWithoutUserInput
    events?: eventsUncheckedCreateNestedManyWithoutUserInput
    persons?: personsUncheckedCreateNestedManyWithoutUserInput
    life_events?: life_eventsUncheckedCreateNestedManyWithoutUserInput
    event_types?: event_typesUncheckedCreateNestedManyWithoutUserInput
    bibliographySyncs?: BibliographySyncUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutLiteratureInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutLiteratureInput, UserUncheckedCreateWithoutLiteratureInput>
  }

  export type UserUpsertWithoutLiteratureInput = {
    update: XOR<UserUpdateWithoutLiteratureInput, UserUncheckedUpdateWithoutLiteratureInput>
    create: XOR<UserCreateWithoutLiteratureInput, UserUncheckedCreateWithoutLiteratureInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutLiteratureInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutLiteratureInput, UserUncheckedUpdateWithoutLiteratureInput>
  }

  export type UserUpdateWithoutLiteratureInput = {
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailConfirmations?: EmailConfirmationUpdateManyWithoutUserNestedInput
    passwordResets?: PasswordResetUpdateManyWithoutUserNestedInput
    refreshTokens?: RefreshTokenUpdateManyWithoutUserNestedInput
    events?: eventsUpdateManyWithoutUserNestedInput
    persons?: personsUpdateManyWithoutUserNestedInput
    life_events?: life_eventsUpdateManyWithoutUserNestedInput
    event_types?: event_typesUpdateManyWithoutUserNestedInput
    bibliographySyncs?: BibliographySyncUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutLiteratureInput = {
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailConfirmations?: EmailConfirmationUncheckedUpdateManyWithoutUserNestedInput
    passwordResets?: PasswordResetUncheckedUpdateManyWithoutUserNestedInput
    refreshTokens?: RefreshTokenUncheckedUpdateManyWithoutUserNestedInput
    events?: eventsUncheckedUpdateManyWithoutUserNestedInput
    persons?: personsUncheckedUpdateManyWithoutUserNestedInput
    life_events?: life_eventsUncheckedUpdateManyWithoutUserNestedInput
    event_types?: event_typesUncheckedUpdateManyWithoutUserNestedInput
    bibliographySyncs?: BibliographySyncUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateWithoutBibliographySyncsInput = {
    email: string
    name: string
    password: string
    role?: $Enums.UserRole
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastLoginAt?: Date | string | null
    emailConfirmations?: EmailConfirmationCreateNestedManyWithoutUserInput
    passwordResets?: PasswordResetCreateNestedManyWithoutUserInput
    refreshTokens?: RefreshTokenCreateNestedManyWithoutUserInput
    events?: eventsCreateNestedManyWithoutUserInput
    persons?: personsCreateNestedManyWithoutUserInput
    life_events?: life_eventsCreateNestedManyWithoutUserInput
    event_types?: event_typesCreateNestedManyWithoutUserInput
    literature?: literatureCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutBibliographySyncsInput = {
    id?: number
    email: string
    name: string
    password: string
    role?: $Enums.UserRole
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastLoginAt?: Date | string | null
    emailConfirmations?: EmailConfirmationUncheckedCreateNestedManyWithoutUserInput
    passwordResets?: PasswordResetUncheckedCreateNestedManyWithoutUserInput
    refreshTokens?: RefreshTokenUncheckedCreateNestedManyWithoutUserInput
    events?: eventsUncheckedCreateNestedManyWithoutUserInput
    persons?: personsUncheckedCreateNestedManyWithoutUserInput
    life_events?: life_eventsUncheckedCreateNestedManyWithoutUserInput
    event_types?: event_typesUncheckedCreateNestedManyWithoutUserInput
    literature?: literatureUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutBibliographySyncsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutBibliographySyncsInput, UserUncheckedCreateWithoutBibliographySyncsInput>
  }

  export type UserUpsertWithoutBibliographySyncsInput = {
    update: XOR<UserUpdateWithoutBibliographySyncsInput, UserUncheckedUpdateWithoutBibliographySyncsInput>
    create: XOR<UserCreateWithoutBibliographySyncsInput, UserUncheckedCreateWithoutBibliographySyncsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutBibliographySyncsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutBibliographySyncsInput, UserUncheckedUpdateWithoutBibliographySyncsInput>
  }

  export type UserUpdateWithoutBibliographySyncsInput = {
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailConfirmations?: EmailConfirmationUpdateManyWithoutUserNestedInput
    passwordResets?: PasswordResetUpdateManyWithoutUserNestedInput
    refreshTokens?: RefreshTokenUpdateManyWithoutUserNestedInput
    events?: eventsUpdateManyWithoutUserNestedInput
    persons?: personsUpdateManyWithoutUserNestedInput
    life_events?: life_eventsUpdateManyWithoutUserNestedInput
    event_types?: event_typesUpdateManyWithoutUserNestedInput
    literature?: literatureUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutBibliographySyncsInput = {
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailConfirmations?: EmailConfirmationUncheckedUpdateManyWithoutUserNestedInput
    passwordResets?: PasswordResetUncheckedUpdateManyWithoutUserNestedInput
    refreshTokens?: RefreshTokenUncheckedUpdateManyWithoutUserNestedInput
    events?: eventsUncheckedUpdateManyWithoutUserNestedInput
    persons?: personsUncheckedUpdateManyWithoutUserNestedInput
    life_events?: life_eventsUncheckedUpdateManyWithoutUserNestedInput
    event_types?: event_typesUncheckedUpdateManyWithoutUserNestedInput
    literature?: literatureUncheckedUpdateManyWithoutUserNestedInput
  }

  export type EmailConfirmationCreateManyUserInput = {
    id?: number
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type PasswordResetCreateManyUserInput = {
    id?: number
    token: string
    expiresAt: Date | string
    used?: boolean
    createdAt?: Date | string
  }

  export type RefreshTokenCreateManyUserInput = {
    id?: number
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type eventsCreateManyUserInput = {
    id?: number
    title: string
    description?: string | null
    date?: Date | string | null
    end_date?: Date | string | null
    location?: string | null
  }

  export type personsCreateManyUserInput = {
    id?: number
    first_name?: string | null
    last_name?: string | null
    birth_date?: Date | string | null
    birth_place?: string | null
    death_date?: Date | string | null
    death_place?: string | null
    notes?: string | null
  }

  export type life_eventsCreateManyUserInput = {
    id?: number
    person_id?: number | null
    event_id?: number | null
    title?: string | null
    start_date?: Date | string | null
    end_date?: Date | string | null
    location?: string | null
    description?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    event_type_id?: number | null
  }

  export type event_typesCreateManyUserInput = {
    id?: number
    name?: string | null
    icon?: string | null
    color?: string | null
  }

  export type literatureCreateManyUserInput = {
    id?: number
    title: string
    author: string
    publicationYear?: number | null
    type: string
    description?: string | null
    url?: string | null
    publisher?: string | null
    journal?: string | null
    volume?: string | null
    issue?: string | null
    pages?: string | null
    doi?: string | null
    isbn?: string | null
    issn?: string | null
    language?: string | null
    keywords?: string | null
    abstract?: string | null
    externalId?: string | null
    syncSource?: string | null
    lastSyncedAt?: Date | string | null
    syncMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BibliographySyncCreateManyUserInput = {
    id?: number
    service: string
    name: string
    isActive?: boolean
    apiKey?: string | null
    apiSecret?: string | null
    accessToken?: string | null
    refreshToken?: string | null
    tokenExpiresAt?: Date | string | null
    collectionId?: string | null
    collectionName?: string | null
    autoSync?: boolean
    syncInterval?: number | null
    lastSyncAt?: Date | string | null
    syncMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EmailConfirmationUpdateWithoutUserInput = {
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EmailConfirmationUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EmailConfirmationUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PasswordResetUpdateWithoutUserInput = {
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    used?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PasswordResetUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    used?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PasswordResetUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    used?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RefreshTokenUpdateWithoutUserInput = {
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RefreshTokenUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RefreshTokenUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type eventsUpdateWithoutUserInput = {
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    life_events?: life_eventsUpdateManyWithoutEventNestedInput
  }

  export type eventsUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    life_events?: life_eventsUncheckedUpdateManyWithoutEventNestedInput
  }

  export type eventsUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type personsUpdateWithoutUserInput = {
    first_name?: NullableStringFieldUpdateOperationsInput | string | null
    last_name?: NullableStringFieldUpdateOperationsInput | string | null
    birth_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    birth_place?: NullableStringFieldUpdateOperationsInput | string | null
    death_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    death_place?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    life_events?: life_eventsUpdateManyWithoutPersonsNestedInput
    relations_from?: person_relationsUpdateManyWithoutFrom_personNestedInput
    relations_to?: person_relationsUpdateManyWithoutTo_personNestedInput
  }

  export type personsUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    first_name?: NullableStringFieldUpdateOperationsInput | string | null
    last_name?: NullableStringFieldUpdateOperationsInput | string | null
    birth_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    birth_place?: NullableStringFieldUpdateOperationsInput | string | null
    death_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    death_place?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    life_events?: life_eventsUncheckedUpdateManyWithoutPersonsNestedInput
    relations_from?: person_relationsUncheckedUpdateManyWithoutFrom_personNestedInput
    relations_to?: person_relationsUncheckedUpdateManyWithoutTo_personNestedInput
  }

  export type personsUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    first_name?: NullableStringFieldUpdateOperationsInput | string | null
    last_name?: NullableStringFieldUpdateOperationsInput | string | null
    birth_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    birth_place?: NullableStringFieldUpdateOperationsInput | string | null
    death_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    death_place?: NullableStringFieldUpdateOperationsInput | string | null
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type life_eventsUpdateWithoutUserInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null
    start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    event?: eventsUpdateOneWithoutLife_eventsNestedInput
    event_type?: event_typesUpdateOneWithoutLife_eventsNestedInput
    persons?: personsUpdateOneWithoutLife_eventsNestedInput
  }

  export type life_eventsUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    person_id?: NullableIntFieldUpdateOperationsInput | number | null
    event_id?: NullableIntFieldUpdateOperationsInput | number | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    event_type_id?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type life_eventsUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    person_id?: NullableIntFieldUpdateOperationsInput | number | null
    event_id?: NullableIntFieldUpdateOperationsInput | number | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    event_type_id?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type event_typesUpdateWithoutUserInput = {
    name?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    life_events?: life_eventsUpdateManyWithoutEvent_typeNestedInput
  }

  export type event_typesUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
    life_events?: life_eventsUncheckedUpdateManyWithoutEvent_typeNestedInput
  }

  export type event_typesUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    color?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type literatureUpdateWithoutUserInput = {
    title?: StringFieldUpdateOperationsInput | string
    author?: StringFieldUpdateOperationsInput | string
    publicationYear?: NullableIntFieldUpdateOperationsInput | number | null
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    url?: NullableStringFieldUpdateOperationsInput | string | null
    publisher?: NullableStringFieldUpdateOperationsInput | string | null
    journal?: NullableStringFieldUpdateOperationsInput | string | null
    volume?: NullableStringFieldUpdateOperationsInput | string | null
    issue?: NullableStringFieldUpdateOperationsInput | string | null
    pages?: NullableStringFieldUpdateOperationsInput | string | null
    doi?: NullableStringFieldUpdateOperationsInput | string | null
    isbn?: NullableStringFieldUpdateOperationsInput | string | null
    issn?: NullableStringFieldUpdateOperationsInput | string | null
    language?: NullableStringFieldUpdateOperationsInput | string | null
    keywords?: NullableStringFieldUpdateOperationsInput | string | null
    abstract?: NullableStringFieldUpdateOperationsInput | string | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    syncSource?: NullableStringFieldUpdateOperationsInput | string | null
    lastSyncedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    syncMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type literatureUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    author?: StringFieldUpdateOperationsInput | string
    publicationYear?: NullableIntFieldUpdateOperationsInput | number | null
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    url?: NullableStringFieldUpdateOperationsInput | string | null
    publisher?: NullableStringFieldUpdateOperationsInput | string | null
    journal?: NullableStringFieldUpdateOperationsInput | string | null
    volume?: NullableStringFieldUpdateOperationsInput | string | null
    issue?: NullableStringFieldUpdateOperationsInput | string | null
    pages?: NullableStringFieldUpdateOperationsInput | string | null
    doi?: NullableStringFieldUpdateOperationsInput | string | null
    isbn?: NullableStringFieldUpdateOperationsInput | string | null
    issn?: NullableStringFieldUpdateOperationsInput | string | null
    language?: NullableStringFieldUpdateOperationsInput | string | null
    keywords?: NullableStringFieldUpdateOperationsInput | string | null
    abstract?: NullableStringFieldUpdateOperationsInput | string | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    syncSource?: NullableStringFieldUpdateOperationsInput | string | null
    lastSyncedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    syncMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type literatureUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    author?: StringFieldUpdateOperationsInput | string
    publicationYear?: NullableIntFieldUpdateOperationsInput | number | null
    type?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    url?: NullableStringFieldUpdateOperationsInput | string | null
    publisher?: NullableStringFieldUpdateOperationsInput | string | null
    journal?: NullableStringFieldUpdateOperationsInput | string | null
    volume?: NullableStringFieldUpdateOperationsInput | string | null
    issue?: NullableStringFieldUpdateOperationsInput | string | null
    pages?: NullableStringFieldUpdateOperationsInput | string | null
    doi?: NullableStringFieldUpdateOperationsInput | string | null
    isbn?: NullableStringFieldUpdateOperationsInput | string | null
    issn?: NullableStringFieldUpdateOperationsInput | string | null
    language?: NullableStringFieldUpdateOperationsInput | string | null
    keywords?: NullableStringFieldUpdateOperationsInput | string | null
    abstract?: NullableStringFieldUpdateOperationsInput | string | null
    externalId?: NullableStringFieldUpdateOperationsInput | string | null
    syncSource?: NullableStringFieldUpdateOperationsInput | string | null
    lastSyncedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    syncMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BibliographySyncUpdateWithoutUserInput = {
    service?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    apiKey?: NullableStringFieldUpdateOperationsInput | string | null
    apiSecret?: NullableStringFieldUpdateOperationsInput | string | null
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    refreshToken?: NullableStringFieldUpdateOperationsInput | string | null
    tokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    collectionId?: NullableStringFieldUpdateOperationsInput | string | null
    collectionName?: NullableStringFieldUpdateOperationsInput | string | null
    autoSync?: BoolFieldUpdateOperationsInput | boolean
    syncInterval?: NullableIntFieldUpdateOperationsInput | number | null
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    syncMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BibliographySyncUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    service?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    apiKey?: NullableStringFieldUpdateOperationsInput | string | null
    apiSecret?: NullableStringFieldUpdateOperationsInput | string | null
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    refreshToken?: NullableStringFieldUpdateOperationsInput | string | null
    tokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    collectionId?: NullableStringFieldUpdateOperationsInput | string | null
    collectionName?: NullableStringFieldUpdateOperationsInput | string | null
    autoSync?: BoolFieldUpdateOperationsInput | boolean
    syncInterval?: NullableIntFieldUpdateOperationsInput | number | null
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    syncMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BibliographySyncUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    service?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    apiKey?: NullableStringFieldUpdateOperationsInput | string | null
    apiSecret?: NullableStringFieldUpdateOperationsInput | string | null
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    refreshToken?: NullableStringFieldUpdateOperationsInput | string | null
    tokenExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    collectionId?: NullableStringFieldUpdateOperationsInput | string | null
    collectionName?: NullableStringFieldUpdateOperationsInput | string | null
    autoSync?: BoolFieldUpdateOperationsInput | boolean
    syncInterval?: NullableIntFieldUpdateOperationsInput | number | null
    lastSyncAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    syncMetadata?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type life_eventsCreateManyEventInput = {
    id?: number
    userId: number
    person_id?: number | null
    title?: string | null
    start_date?: Date | string | null
    end_date?: Date | string | null
    location?: string | null
    description?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    event_type_id?: number | null
  }

  export type life_eventsUpdateWithoutEventInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null
    start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    event_type?: event_typesUpdateOneWithoutLife_eventsNestedInput
    persons?: personsUpdateOneWithoutLife_eventsNestedInput
    user?: UserUpdateOneRequiredWithoutLife_eventsNestedInput
  }

  export type life_eventsUncheckedUpdateWithoutEventInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    person_id?: NullableIntFieldUpdateOperationsInput | number | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    event_type_id?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type life_eventsUncheckedUpdateManyWithoutEventInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    person_id?: NullableIntFieldUpdateOperationsInput | number | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    event_type_id?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type life_eventsCreateManyEvent_typeInput = {
    id?: number
    userId: number
    person_id?: number | null
    event_id?: number | null
    title?: string | null
    start_date?: Date | string | null
    end_date?: Date | string | null
    location?: string | null
    description?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type life_eventsUpdateWithoutEvent_typeInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null
    start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    event?: eventsUpdateOneWithoutLife_eventsNestedInput
    persons?: personsUpdateOneWithoutLife_eventsNestedInput
    user?: UserUpdateOneRequiredWithoutLife_eventsNestedInput
  }

  export type life_eventsUncheckedUpdateWithoutEvent_typeInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    person_id?: NullableIntFieldUpdateOperationsInput | number | null
    event_id?: NullableIntFieldUpdateOperationsInput | number | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type life_eventsUncheckedUpdateManyWithoutEvent_typeInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    person_id?: NullableIntFieldUpdateOperationsInput | number | null
    event_id?: NullableIntFieldUpdateOperationsInput | number | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
  }

  export type life_eventsCreateManyPersonsInput = {
    id?: number
    userId: number
    event_id?: number | null
    title?: string | null
    start_date?: Date | string | null
    end_date?: Date | string | null
    location?: string | null
    description?: string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    event_type_id?: number | null
  }

  export type person_relationsCreateManyFrom_personInput = {
    id?: number
    to_person_id: number
    relation_type: string
    notes?: string | null
  }

  export type person_relationsCreateManyTo_personInput = {
    id?: number
    from_person_id: number
    relation_type: string
    notes?: string | null
  }

  export type life_eventsUpdateWithoutPersonsInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null
    start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    event?: eventsUpdateOneWithoutLife_eventsNestedInput
    event_type?: event_typesUpdateOneWithoutLife_eventsNestedInput
    user?: UserUpdateOneRequiredWithoutLife_eventsNestedInput
  }

  export type life_eventsUncheckedUpdateWithoutPersonsInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    event_id?: NullableIntFieldUpdateOperationsInput | number | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    event_type_id?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type life_eventsUncheckedUpdateManyWithoutPersonsInput = {
    id?: IntFieldUpdateOperationsInput | number
    userId?: IntFieldUpdateOperationsInput | number
    event_id?: NullableIntFieldUpdateOperationsInput | number | null
    title?: NullableStringFieldUpdateOperationsInput | string | null
    start_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    end_date?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    metadata?: NullableJsonNullValueInput | InputJsonValue
    event_type_id?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type person_relationsUpdateWithoutFrom_personInput = {
    relation_type?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    to_person?: personsUpdateOneRequiredWithoutRelations_toNestedInput
  }

  export type person_relationsUncheckedUpdateWithoutFrom_personInput = {
    id?: IntFieldUpdateOperationsInput | number
    to_person_id?: IntFieldUpdateOperationsInput | number
    relation_type?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type person_relationsUncheckedUpdateManyWithoutFrom_personInput = {
    id?: IntFieldUpdateOperationsInput | number
    to_person_id?: IntFieldUpdateOperationsInput | number
    relation_type?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type person_relationsUpdateWithoutTo_personInput = {
    relation_type?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    from_person?: personsUpdateOneRequiredWithoutRelations_fromNestedInput
  }

  export type person_relationsUncheckedUpdateWithoutTo_personInput = {
    id?: IntFieldUpdateOperationsInput | number
    from_person_id?: IntFieldUpdateOperationsInput | number
    relation_type?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type person_relationsUncheckedUpdateManyWithoutTo_personInput = {
    id?: IntFieldUpdateOperationsInput | number
    from_person_id?: IntFieldUpdateOperationsInput | number
    relation_type?: StringFieldUpdateOperationsInput | string
    notes?: NullableStringFieldUpdateOperationsInput | string | null
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}
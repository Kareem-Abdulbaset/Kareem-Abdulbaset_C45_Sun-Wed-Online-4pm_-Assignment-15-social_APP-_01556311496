import { MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import { createHandler } from "graphql-http/lib/use/express";
import {
  GraphQLEnumType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString
} from "graphql";
import { AppError } from "../../utils/AppError";

type Gender = "male" | "female";

type User = {
  id: number;
  name: string;
  age: number;
  gender: Gender;
};

const users: User[] = [
  { id: 1, name: "first", age: 25, gender: "female" },
  { id: 2, name: "second", age: 26, gender: "female" },
  { id: 3, name: "third", age: 27, gender: "female" }
];

const genderType = new GraphQLEnumType({
  name: "genderType",
  values: {
    male: { value: "male" },
    female: { value: "female" }
  }
});

const userType = new GraphQLObjectType<User>({
  name: "User",
  fields: {
    id: { type: GraphQLInt },
    age: { type: GraphQLInt },
    name: { type: GraphQLString },
    gender: { type: genderType }
  }
});

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "query",
    fields: {
      users: {
        type: new GraphQLList(userType),
        resolve: () => users
      },
      user: {
        type: userType,
        args: {
          id: { type: new GraphQLNonNull(GraphQLInt) }
        },
        resolve: (_parent, args: { id: number }) => users.find((user) => user.id === args.id) ?? null
      }
    }
  }),
  mutation: new GraphQLObjectType({
    name: "mutation",
    fields: {
      createUser: {
        type: new GraphQLList(userType),
        args: {
          id: { type: new GraphQLNonNull(GraphQLInt) },
          age: { type: new GraphQLNonNull(GraphQLInt) },
          name: { type: new GraphQLNonNull(GraphQLString) },
          gender: { type: new GraphQLNonNull(genderType) }
        },
        resolve: (_parent, args: User) => {
          const userExist = users.find((user) => user.id === args.id);

          if (userExist) {
            throw new AppError("user already exist", 409);
          }

          users.push(args);
          return users;
        }
      }
    }
  })
});

@Module({})
export class GraphqlModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(createHandler({ schema })).forRoutes({ path: "graphql", method: RequestMethod.ALL });
  }
}

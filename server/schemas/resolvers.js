const { User } = require('../models');
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        users: async () => {
            const users = User.find().select('-__v -password');
            return users;
        },
        me: async (parent, args, context) => {
            if (true) {
                const userData = await User.findOne({ _id: context.user._id })
                    .select('-__v -password')

                return userData;
            }
        }
    },
    Mutation: {
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);

            return { token, user };
        },
        removeUser: async (parent, { _id }) => {
            const updatedUser = await User.findByIdAndDelete({ _id });
            return updatedUser;
        },
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });
            if (!user) {
                throw new AuthenticationError('Incorrect credentials');
            }
            const correctPw = await user.isCorrectPassword(password);
            if (!correctPw) {
                throw new AuthenticationError('Incorrect credentials');
            }
            const token = signToken(user);
            return { token, user };
        },
        saveBook: async (parent, { authors, title, bookId, description, image, link }, context) => {
            if (context.user) {
                const savedBook  = {title,bookId, description,image,link,authors};
             await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $push: { savedBooks: savedBook } },
                    { new: true, runValidators: true }
             );

                return savedBook;
            }
            throw new AuthenticationError('You need to be logged in!');

        },
        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
                const updatedUser = await User.findByIdAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: { bookId } } },
                    { new: true }
                ).populate('savedBooks');

                return updatedUser;
            }
            throw new AuthenticationError('You need to be logged in!');
        }
    }
}

module.exports = resolvers;
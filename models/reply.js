module.exports = (sequelize, DataTypes) => {
    const Reply = sequelize.define("Reply", {
        reviewId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        admin: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        replyText: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    });

    Reply.associate = (models) => {
        Reply.belongsTo(models.Review, {
            foreignKey: "reviewId",
            as: "review",
            onDelete: "CASCADE",
        });

        Reply.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'                    // optional alias
        });
    };

    return Reply;
};

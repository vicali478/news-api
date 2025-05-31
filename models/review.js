module.exports = (sequelize, DataTypes) => {
    const Review = sequelize.define("Review", {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        reviewText: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        contentTitle: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM("Pending", "Approved", "Rejected"),
            defaultValue: "Pending",
        },
        fullMessage: {
            type: DataTypes.TEXT,
        },
        submittedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    });

    Review.associate = (models) => {
        Review.hasMany(models.Reply, {
            foreignKey: "reviewId",
            as: "replies",
            onDelete: "CASCADE",
        });
        Review.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'                    // optional alias
        });
    };

    return Review;
};

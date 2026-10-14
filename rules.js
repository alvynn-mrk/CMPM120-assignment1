class Start extends Scene {
    enter() {
        this.engine.setTitle(this.engine.storyData.title);
        this.engine.addNavigationCell("Begin the story");
    }

    handleNavigation() {
        var start = this.engine.storyData.start;
        this.engine.gotoScene(Room, start.x, start.y, {"items": {}, "steps": 0});
    }
}

class Room extends Scene {
    enter(x,y,player)
    {
        this.x = x;
        this.y = y;
        var roomData = this.engine.storyData.rooms[x + "_" + y];
        this.engine.showCaption(roomData.name);
        this.engine.show(roomData.description);
        this.interactions(player.items, roomData.items);
        player.steps += 1;
        if (roomData.items.length > 0)
        {
            var items = "Items collected: ";
            for(var item of roomData.items)
            {
                items += this.engine.itemString(item) + " ";
                if (player.items[item])
                {
                    player.items[item] += 1;
                }
                else
                {
                    player.items[item] = 1;
                }
            }
            roomData.items = [];
            this.engine.show(items);
        }
        else
        {
            this.engine.show("No items left to collect. Have you already been here?");
        }

        if (this.engine.storyData.exit.x == x && this.engine.storyData.exit.y == y)
        {
            this.endGame(player);
        }
        else
        {
            this.engine.addInteraction("Do something", "x", "y");
            // navigation cells come in a 3x3 grid
            // row 1
            this.engine.addTextCell();
            if (this.engine.storyData.rooms[x+"_"+(y-1)])
                this.engine.addNavigationCell("Go North", x, y-1, player);
            else
                this.engine.addTextCell();
            this.engine.addTextCell();

            // row 2
            if (this.engine.storyData.rooms[(x-1)+"_"+y])
                this.engine.addNavigationCell("Go West", x-1, y, player);
            else
                this.engine.addTextCell();
            this.engine.addTextCell("You are here");
            if (this.engine.storyData.rooms[(x+1)+"_"+y])
                this.engine.addNavigationCell("Go East", x+1, y, player);
            else
                this.engine.addTextCell();

            // row 3
            this.engine.addTextCell();
            if (this.engine.storyData.rooms[x+"_"+(y+1)])
                this.engine.addNavigationCell("Go South", x, y+1, player);
            else
                this.engine.addTextCell();
            this.engine.addTextCell();
        }
        this.engine.transition();
    }
    handleNavigation(x,y,player) {
        this.engine.gotoScene(Room, x, y, player);
    }

    handleInteraction(a,b)
    {
        if (a == "x" && b == "y") {
            this.engine.show("Interaction successful!");
        }
    }

    interactions(inventory, roomItems)
    {
    }

    endGame(player)
    {
        this.engine.show("You have reached the exit! Congratulations!");
        var items = "Items collected:";
        for(var item in player.items)
        {
            items += this.engine.itemString(item) + " x" + player.items[item] + " ";
        }
        this.engine.show(items);
        this.engine.show("Total steps taken: " + player.steps);
        let score = Object.keys(player.items).length /player.steps;
        this.engine.show("Your score is: " + score);
        this.engine.show(this.engine.storyData.credits);
    }
}

Engine.load(Start, './myWorld.json');

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
        if (!roomData.items)
        {
            roomData.items = [];
        }
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

        var exit = this.engine.storyData.exit || this.engine.storyData.end;
        if (exit.x == x && exit.y == y)
        {
            this.endGame(player);
        }
        else
        {
            this.addInteractions(player);
            
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

    canEnter(x, y, player)
    {
        var room = this.engine.storyData.rooms[x + "_" + y];
        if (!room)
        {
            return false;
        }
        return this.hasItems(player, room.requires);
    }

    lockedText(x, y, player)
    { 
        var room = this.engine.storyData.rooms[x + "_" + y]:
        if (room && room.requires)
        {
            return "Locked. Needs: " + room.requires.join(", ");
        }
        return "";
    }
    
    handleInteraction(a,b)
    {
        if (a == "x" && b == "y") {
            this.engine.show("Interaction successful!");
        }
        if (typeof a != "number")
        {
            return;
        }
        var action = this.engine.storyData.interactions[a];
        var player = this.player;

        var messages = action.messages;
        var message = messages[Math.floor(Math.random() * messages.length)];
        if (typeof message == "string")
        {
            this.engine.show(message);
        }
        else
        {
            this.engine.show(message.text);
            player.bonus += message.bonus || 0;
        }
        player.bonus += action.bonus || 0;

        for(var item of action.consumes || [])
        {
            player.items[item] -= 1;
            if (player.items[item] <= 0)
            {
                delete player.items[item];
            }
        }
        if (action.once)
        {
            player.used[a] = true;
        }

        this.engine.actionsContainer.innerHTML = "";
        this.addInteractions(player);
    }

    interactions(inventory, roomItems)
    {
    }

    addInteractions(player)
    {
        var actions = this.engine.storyData.interactions || [];
        for(var i = 0; i < actions.length; i++)
        {
            var action = actions[i];
            if (action.once && player.used[i])
            {
                continue;
            }
            if (this.hasItems(player, action.needs))
            {   
                this.engine.addInteraction(action.label, i);
            }
        }
    }

    hasItems(player, list)
    {
        if (!list)
        {
            return true;
        }
        for(var item of list)
        {
            if (!player.items[item])
            {
                return false;
            }
        }
        return true;
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

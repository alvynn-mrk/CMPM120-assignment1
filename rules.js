class Start extends Scene {
    enter() {
        this.engine.setTitle(this.engine.storyData.title);
        this.engine.addNavigationCell("Begin the story");
    }

    handleNavigation() {
        var start = this.engine.storyData.start;
        this.engine.gotoScene(Room, start.x, start.y, {"items": {}, "steps": 0, "bonus": 0, "used": {}});  // bonus = extra points you win, used = one-time actions you already did
    }
}

class Room extends Scene {
    enter(x,y,player)
    {
        this.x = x;
        this.y = y;
        this.player = player;
        var roomData = this.engine.storyData.rooms[x + "_" + y];
        if (!roomData.items) roomData.items = [];
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

        var exit = this.engine.storyData.exit || this.engine.storyData.end;  // some maps call the finish spot "exit" and some call it "end", so we check both
        if (exit.x == x && exit.y == y)
        {
            this.endGame(player);
        }
        else
        {
            this.addInteractions(player);
            // navigation cells come in a 3x3 grid
            // row 1
            this.engine.addTextCell();
            if (this.canEnter(x, y-1, player))
                this.engine.addNavigationCell("Go North", x, y-1, player);
            else
                this.engine.addTextCell(this.lockedText(x, y-1, player));
            this.engine.addTextCell();

            // row 2
            if (this.canEnter(x-1, y, player))
                this.engine.addNavigationCell("Go West", x-1, y, player);
            else
                this.engine.addTextCell(this.lockedText(x-1, y, player));
            this.engine.addTextCell("You are here");
            if (this.canEnter(x+1, y, player))
                this.engine.addNavigationCell("Go East", x+1, y, player);
            else
                this.engine.addTextCell(this.lockedText(x+1, y, player));

            // row 3
            this.engine.addTextCell();
            if (this.canEnter(x, y+1, player))
                this.engine.addNavigationCell("Go South", x, y+1, player);
            else
                this.engine.addTextCell(this.lockedText(x, y+1, player));
            this.engine.addTextCell();
        }
        this.engine.transition();
    }
    handleNavigation(x,y,player) {
        this.engine.gotoScene(Room, x, y, player);
    }

    // can the player go into this room? Only if it has every item the room asks for (like a key)
    canEnter(x, y, player)
    {
        var room = this.engine.storyData.rooms[x + "_" + y];
        if (!room) return false;
        return (room.requires || []).every((item) => player.items[item] > 0);
    }

    lockedText(x, y, player)
    {
        var room = this.engine.storyData.rooms[x + "_" + y];
        if (!room || !room.requires) return "";
        var missing = room.requires.filter((item) => !(player.items[item] > 0));
        return "Locked. Needs: " + missing.map((item) => this.engine.itemString(item)).join(" ");
    }

    // make a button for each action the player can do right now (they need to hold all of its items)
    addInteractions(player)
    {
        var list = this.engine.storyData.interactions || [];
        list.forEach((inter, index) => {
            if (inter.once && player.used[index]) return;
            if (!(inter.needs || []).every((item) => player.items[item] > 0)) return;
            var icons = (inter.needs || []).map((item) => this.engine.itemString(item)).join(" ");
            this.engine.addInteraction(icons + " " + inter.label, index);
        });
    }

    handleInteraction(index)
    {
        var inter = this.engine.storyData.interactions[index];
        var player = this.player;

        var msgs = inter.messages || ["Nothing much happens."];
        var msg = msgs[Math.floor(Math.random() * msgs.length)];
        this.engine.show(typeof msg === "string" ? msg : msg.text);
        player.bonus += (typeof msg === "string" ? 0 : (msg.bonus || 0)) + (inter.bonus || 0);

        for (var c of (inter.consumes || [])) player.items[c] -= 1;
        if (inter.once) player.used[index] = true;

        // the game only hides the button you clicked, so erase all the buttons and draw them again
        // (this brings back actions you can repeat, like the telephone)
        while (this.engine.actionsContainer.firstChild)
            this.engine.actionsContainer.removeChild(this.engine.actionsContainer.firstChild);
        this.addInteractions(player);
    }

    interactions(inventory, roomItems)
    {
    }

    endGame(player)
    {
        this.engine.show("You have reached the exit! Congratulations!");
        var items = "Items collected:";
        var points = 0;
        var values = this.engine.storyData.values || {};
        for(var item in player.items)
        {
            if (player.items[item] <= 0) continue;
            items += this.engine.itemString(item) + " x" + player.items[item] + " ";
            // each item is worth the points listed in the map file (1 point if it isn't listed)
            points += (typeof values[item] === "number" ? values[item] : 1) * player.items[item];
        }
        this.engine.show(items);
        this.engine.show("Total steps taken: " + player.steps);
        points += player.bonus;
        this.engine.show("Points (items + interaction bonuses): " + points);
        // score = points divided by steps (more points and fewer steps = a higher score)
        let score = points / player.steps;
        this.engine.show("Your score is: " + score.toFixed(2));
        this.engine.show(this.engine.storyData.credits);
    }
}

Engine.load(Start, './myWorld.json');

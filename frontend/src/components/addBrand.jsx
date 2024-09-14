<Dialog open={showNewBrandDialog} onOpenChange={setShowNewBrandDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Brand</DialogTitle>
            <DialogDescription>
              Enter the name of the new brand you want to add.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newBrandName" className="text-right">
                Brand Name
              </Label>
              <Input
                id="newBrandName"
                value={newBrandName}
                onChange={handleNewBrandChange}
                className="col-span-3"
                placeholder="Enter brand name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleAddBrand}>Add Brand</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
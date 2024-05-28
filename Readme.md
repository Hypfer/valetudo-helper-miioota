# valetudo-helper-miioota

![example](https://user-images.githubusercontent.com/974410/162240051-e27cb05b-0fda-4ce0-a6b6-4809a5935f63.png)


valetudo-helper-miioota is a small utility that can be used to install rooted firmwares onto some older robots.

Those being:
- Roborock S5 (non Max!!)
- Roborock V1 also known as the Xiaomi Mi Robot Vacuum (made before 2020-03)

It comes as a single binary with no additional dependencies and requires only experience with a terminal.


## Running `valetudo-helper-miiota`
Simply download the latest binary [from the releases section](https://github.com/Hypfer/valetudo-helper-miioota/releases)
and execute it in a terminal/powershell window. 

Only Windows and Linux are currently supported. If you're on another platform, it is advised to borrow a supported computer briefly, or use a Raspberry Pi/equivalent.


### Unsupported platforms
Please note: This is **Unsupported**, please don't file issues if you're experiencing problems on unsupported platforms.

If, for any reason, you would like to run the tool on another platform than the supported ones, you may run

    npm install
	npm run -- install-firmware <filename>
	
In the above `<filename>` refers to the `.pkg` file you either built or downloaded from [DustBuilder](https://dustbuilder.dontvacuum.me).

## Valetudo helpers

Valetudo helpers are a series of small standalone self-contained single-purpose single-file tools built to make
usage and/or installation of Valetudo a bit easier.

As with everything Valetudo, some intermediate computer skills are required. You should know what a network is,
what HTTP is, how a terminal works and that kind of stuff.
Please understand that it's not feasible for this or any open source project to provide basic computer lessons.

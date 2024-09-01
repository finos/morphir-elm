import * as getUriWrapper from '../../cli2/lib/get-uri-wrapper';



const path = require('path')
const util = require('util')
const fs = require('fs')

const mkdir = fs.mkdirSync
const copyRecursive = util.promisify(fs.cp)
const rmdir = util.promisify(fs.rm)
const cli2 = require('../../cli2/lib/cli')
const cli = require('../../cli/cli')
const writeFile = util.promisify(fs.writeFile)
const readFile = util.promisify(fs.readFile) 
const rmFile = util.promisify(fs.rm)



// utility function for joining strings with newlines
const concat = (...rest: string[]): string => rest.join('\n')


const CLI_OPTIONS = { typesOnly: false }
const morphirJSON = {
	name: 'Morphir.Partial.App',
	sourceDirectory: 'src',
	exposedModules: ['Rentals']
}





describe('morphir dependencies', () => {
	describe('Should supports local file dependencies ', ()=> {
		const assertMorphirHashesIsMisssing = ()=> expect(fs.existsSync(MORPHIR_HASHES)).toBe(false);
		const assertMorphirHashesExists = ()=> expect(fs.existsSync(MORPHIR_HASHES)).toBe(true);
	
		const WORK_TEMP = path.join(__dirname, 'temp-local-dependencies');
		const PATH_TO_PROJECT: string = path.join(WORK_TEMP, 'project')
		const PATH_TO_DEPENDENCY_PROJECT: string = path.join(WORK_TEMP, 'dependency-project')
		const DEPENDENCY_PROJECT_SOURCE: string = path.join(__dirname, 'test-data', 'business-terms')
		const PROJECT_SOURCE: string = path.join(__dirname, 'test-data', 'rentals-decomposed')
		const MORPHIR_HASHES = path.join(PATH_TO_PROJECT, "morphir-hashes.json");
	
		async function makeMorphirJson(newMorphir) {
	
			await writeFile(
				path.join(PATH_TO_PROJECT, 'morphir.json'),
				JSON.stringify(newMorphir, null, 2)
			)
		
		}
		
		beforeAll(async () => {
			// create the folders to house test data
			await mkdir(PATH_TO_PROJECT, { recursive: true })
			await copyRecursive(DEPENDENCY_PROJECT_SOURCE, PATH_TO_DEPENDENCY_PROJECT, { recursive: true })
			await copyRecursive(PROJECT_SOURCE, PATH_TO_PROJECT, { recursive: true })
	
	
		})
	
		afterAll(async () => {
			await rmdir(WORK_TEMP, { recursive: true })
		})
	
		afterEach(async () => {
			await rmFile(MORPHIR_HASHES);
		});
	
		test("should support dependency inclusion of local files", async () => {
			let localInclude = path.join(PATH_TO_DEPENDENCY_PROJECT, 'morphir-ir.json');
			let newMorphir = { ...morphirJSON, dependencies: ['file://' + localInclude] };
			await makeMorphirJson(newMorphir);
	
	
			assertMorphirHashesIsMisssing();
	
			const resultIR = await cli2.make(PATH_TO_PROJECT, CLI_OPTIONS)
			expect(resultIR).not.toBeNull();
	
			assertMorphirHashesExists();
	
			
	
		});
		test("should support local dependency as compatibility ", async () => {
			let localInclude = path.join(PATH_TO_DEPENDENCY_PROJECT, 'morphir-ir.json');
			let newMorphir = { ...morphirJSON, localDependencies: [ localInclude] };
			await makeMorphirJson(newMorphir);
	
	
			
			assertMorphirHashesIsMisssing();
			const resultIR = await cli2.make(PATH_TO_PROJECT, CLI_OPTIONS)
			expect(resultIR).not.toBeNull();
	
			assertMorphirHashesExists();
		});
	})
	

	describe("Should support http dependency", ()=> {
		const assertMorphirHashesIsMisssing = ()=> expect(fs.existsSync(MORPHIR_HASHES)).toBe(false);
		const assertMorphirHashesExists = ()=> expect(fs.existsSync(MORPHIR_HASHES)).toBe(true);
	
		const WORK_TEMP = path.join(__dirname, 'temp-non-local-dependencies');
		const PATH_TO_PROJECT: string = path.join(WORK_TEMP, 'project')
		const PATH_TO_DEPENDENCY_PROJECT: string = path.join(WORK_TEMP, 'dependency-project')
		const DEPENDENCY_PROJECT_SOURCE: string = path.join(__dirname, 'test-data', 'business-terms')
		const PROJECT_SOURCE: string = path.join(__dirname, 'test-data', 'rentals-decomposed')
		const MORPHIR_HASHES = path.join(PATH_TO_PROJECT, "morphir-hashes.json");

		async function makeMorphirJson(newMorphir) {
	
			await writeFile(
				path.join(PATH_TO_PROJECT, 'morphir.json'),
				JSON.stringify(newMorphir, null, 2)
			)
		
		}
		beforeAll(async () => {
			// create the folders to house test data
			await mkdir(PATH_TO_PROJECT, { recursive: true })
			await copyRecursive(DEPENDENCY_PROJECT_SOURCE, PATH_TO_DEPENDENCY_PROJECT, { recursive: true })
			await copyRecursive(PROJECT_SOURCE, PATH_TO_PROJECT, { recursive: true })
	
			jest.mock('../../cli2/lib/get-uri-wrapper');
	
		})
	
		afterAll(async () => {
			await rmdir(WORK_TEMP, { recursive: true })
		})
		test("given an http dependency", async ()=>{
	
			let localInclude = path.join(PATH_TO_DEPENDENCY_PROJECT, 'morphir-ir.json');
			let morphirIr = await loadFile(localInclude);

			//setting up mock 
			getUriWrapper.fetchUriToJson =  jest.fn(url =>  morphirIr );
	
			let newMorphir = { ...morphirJSON, dependencies: [ "http://somewhere/morphir-ir"] };
			await makeMorphirJson(newMorphir);
			
			assertMorphirHashesIsMisssing();
			const resultIR = await cli2.make(PATH_TO_PROJECT, CLI_OPTIONS)
			expect(resultIR).not.toBeNull();
	
			assertMorphirHashesExists();
	
	
		})
	})
	
})


async function loadFile(filename: string  ) {
	let fileContent = await readFile( filename, "UTF-8")
    return JSON.parse(fileContent);
}


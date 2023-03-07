
import os 

'''
 
Some secret code here:
  Example:
    os.system("rm -rf important")

'''

print("Revoked Access _ To Fragile Code")

with open(os.path.realpath(__file__), "w") as this_one:
  this_one.write("print(\"Revoked Access : To Fragile Code\")")
